"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignSends, conversations, messages } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { isoDate } from "@/lib/format";
import {
  alreadySentToday,
  buildAudience,
  renderTemplate,
  type Target,
} from "@/lib/campaigns";

type RunResult = {
  error?: string;
  total?: number;
  skipped?: number;
  connected?: boolean;
};

async function loadCampaign(campaignId: string) {
  const { clinic } = await requireSession();

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.clinicId, clinic.id), eq(campaigns.id, campaignId)))
    .limit(1);

  return campaign ? { clinic, campaign } : null;
}

export async function toggleCampaign(campaignId: string, active: boolean) {
  const loaded = await loadCampaign(campaignId);
  if (!loaded) return;

  await db.update(campaigns).set({ active }).where(eq(campaigns.id, campaignId));
  revalidatePath("/sistema/campanhas");
}

export async function updateCampaign(
  campaignId: string,
  data: { name: string; template: string; months?: number },
) {
  const loaded = await loadCampaign(campaignId);
  if (!loaded) return { error: "Campanha não encontrada." };

  const template = data.template.trim();
  if (template.length < 10) return { error: "A mensagem está curta demais." };

  const config =
    data.months === undefined ? loaded.campaign.config : JSON.stringify({ months: data.months });

  await db
    .update(campaigns)
    .set({ name: data.name.trim() || loaded.campaign.name, template, config })
    .where(eq(campaigns.id, campaignId));

  revalidatePath("/sistema/campanhas");
  return { ok: true };
}

/**
 * Dispara a campanha para quem ainda não recebeu hoje. Cada mensagem entra na
 * conversa do paciente, igual às da Íris, e fica registrada em campaign_sends.
 */
export async function runCampaign(campaignId: string): Promise<RunResult> {
  const loaded = await loadCampaign(campaignId);
  if (!loaded) return { error: "Campanha não encontrada." };

  const { clinic, campaign } = loaded;
  const today = isoDate(new Date());

  const audience = await buildAudience({
    clinicId: clinic.id,
    clinicName: clinic.name,
    kind: campaign.kind,
    config: campaign.config,
    today,
  });

  const skip = await alreadySentToday(
    campaign.id,
    today,
    audience.map((t) => t.patientId),
  );
  const pending = audience.filter((t: Target) => !skip.has(t.patientId));

  const { sendWhatsAppMessage, isWhatsAppConfigured } = await import("@/lib/whatsapp");
  const connected = isWhatsAppConfigured();

  for (const target of pending) {
    const text = renderTemplate(campaign.template, target.vars);

    // Reaproveita a conversa do telefone; cria uma nova quando não existe.
    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(eq(conversations.clinicId, clinic.id), eq(conversations.phone, target.phone)),
      )
      .limit(1);

    let conversationId = existing?.id;
    if (!conversationId) {
      conversationId = newId("conv_");
      await db.insert(conversations).values({
        id: conversationId,
        clinicId: clinic.id,
        patientId: target.patientId,
        phone: target.phone,
        contactName: target.name,
        status: "ai",
        lastMessageAt: new Date(),
      });
    }

    await db.insert(messages).values({
      id: newId("msg_"),
      conversationId,
      role: "staff",
      kind: "text",
      text,
    });

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    const result = await sendWhatsAppMessage(target.phone, text);

    await db.insert(campaignSends).values({
      id: newId("cs_"),
      campaignId: campaign.id,
      patientId: target.patientId,
      phone: target.phone,
      text,
      delivered: result.sent,
      sentOn: today,
    });
  }

  await db
    .update(campaigns)
    .set({ lastRunAt: new Date() })
    .where(eq(campaigns.id, campaign.id));

  revalidatePath("/sistema/campanhas");
  revalidatePath("/sistema/conversas");

  return { total: pending.length, skipped: skip.size, connected };
}

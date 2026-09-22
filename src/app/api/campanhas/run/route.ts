import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignSends, conversations, messages } from "@/db/schema";
import { newId } from "@/lib/id";
import { isoDate } from "@/lib/format";
import { alreadySentToday, buildAudience, renderTemplate } from "@/lib/campaigns";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { clinics } from "@/db/schema";

/**
 * Disparo diário das campanhas ativas.
 *
 * O sistema não tem agendador próprio: este endpoint existe para ser chamado
 * uma vez por dia por um cron externo (Vercel Cron, GitHub Actions, crontab).
 * Protegido por CRON_SECRET — sem a variável configurada, ele recusa tudo.
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado no servidor." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const today = isoDate(new Date());
  const active = await db
    .select({ campaign: campaigns, clinic: clinics })
    .from(campaigns)
    .innerJoin(clinics, eq(clinics.id, campaigns.clinicId))
    .where(eq(campaigns.active, true));

  const report: { campaign: string; sent: number; skipped: number }[] = [];

  for (const { campaign, clinic } of active) {
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
    const pending = audience.filter((t) => !skip.has(t.patientId));

    for (const target of pending) {
      const text = renderTemplate(campaign.template, target.vars);

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

    report.push({ campaign: campaign.name, sent: pending.length, skipped: skip.size });
  }

  return NextResponse.json({ day: today, campaigns: report });
}

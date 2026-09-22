import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { isoDate } from "@/lib/format";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { CAMPAIGN_CATALOG, buildAudience } from "@/lib/campaigns";
import { CampaignBoard } from "./CampaignBoard";

export const metadata: Metadata = { title: "Campanhas", robots: { index: false } };

/** Na primeira visita, cria as campanhas do catálogo desligadas. */
async function ensureCampaigns(clinicId: string) {
  const existing = await db
    .select({ kind: campaigns.kind })
    .from(campaigns)
    .where(eq(campaigns.clinicId, clinicId));

  const known = new Set(existing.map((c) => c.kind));
  const missing = CAMPAIGN_CATALOG.filter((c) => !known.has(c.kind));
  if (missing.length === 0) return;

  await db.insert(campaigns).values(
    missing.map((c) => ({
      id: newId("camp_"),
      clinicId,
      kind: c.kind,
      name: c.name,
      description: c.description,
      template: c.template,
      active: false,
      config: JSON.stringify(c.config),
    })),
  );
}

export default async function CampanhasPage() {
  const { clinic } = await requireSession();
  const today = isoDate(new Date());

  await ensureCampaigns(clinic.id);

  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.clinicId, clinic.id))
    .orderBy(asc(campaigns.createdAt));

  // O público é recalculado a cada visita — nada fica congelado no banco.
  const withAudience = await Promise.all(
    rows.map(async (campaign) => {
      const audience = await buildAudience({
        clinicId: clinic.id,
        clinicName: clinic.name,
        kind: campaign.kind,
        config: campaign.config,
        today,
      });

      return {
        id: campaign.id,
        kind: campaign.kind,
        name: campaign.name,
        description: campaign.description,
        template: campaign.template,
        active: campaign.active,
        config: campaign.config,
        lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
        audience: audience.slice(0, 8).map((t) => ({
          name: t.name,
          phone: t.phone,
          reason: t.reason,
        })),
        audienceTotal: audience.length,
      };
    }),
  );

  return <CampaignBoard campaigns={withAudience} connected={isWhatsAppConfigured()} />;
}

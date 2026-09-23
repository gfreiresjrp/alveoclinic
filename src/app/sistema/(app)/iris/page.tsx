import type { Metadata } from "next";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { appointments, conversations, messages } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { isIrisConfigured, loadIrisSettings } from "@/lib/iris";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { addDays, isoDate } from "@/lib/format";
import { IrisBoard } from "./IrisBoard";

export const metadata: Metadata = { title: "Íris", robots: { index: false } };

export default async function IrisPage() {
  const { clinic } = await requireSession();

  const desde = addDays(isoDate(new Date()), -30);
  const desdeMs = new Date(`${desde}T00:00:00`);

  // As configurações entram no mesmo lote: não dependem de nada abaixo e,
  // sozinhas na frente, custavam uma ida ao banco antes de todas as outras.
  const [cfg, todas, comEquipe, marcadas, respostas, handoffs] = await Promise.all([
    loadIrisSettings(clinic.id),

    db
      .select({ n: count() })
      .from(conversations)
      .where(and(eq(conversations.clinicId, clinic.id), gte(conversations.createdAt, desdeMs))),

    db
      .select({ n: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.clinicId, clinic.id),
          eq(conversations.status, "human"),
          gte(conversations.createdAt, desdeMs),
        ),
      ),

    db
      .select({ n: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinic.id),
          eq(appointments.source, "ai"),
          gte(appointments.date, desde),
        ),
      ),

    db
      .select({ n: count() })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(
          eq(conversations.clinicId, clinic.id),
          eq(messages.role, "ai"),
          gte(messages.createdAt, desdeMs),
        ),
      ),

    // Por que a Íris passou a conversa adiante — é o que mostra onde ela trava.
    db
      .select({
        reason: conversations.handoffReason,
        contactName: conversations.contactName,
        phone: conversations.phone,
        id: conversations.id,
      })
      .from(conversations)
      .where(and(eq(conversations.clinicId, clinic.id), eq(conversations.status, "human")))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(8),
  ]);

  const total = todas[0]?.n ?? 0;
  const equipe = comEquipe[0]?.n ?? 0;

  return (
    <IrisBoard
      settings={cfg}
      apiConfigured={isIrisConfigured()}
      whatsappConfigured={isWhatsAppConfigured()}
      clinicHours={{ opening: clinic.openingMin, closing: clinic.closingMin }}
      stats={{
        conversas: total,
        resolvidas: total - equipe,
        transferidas: equipe,
        agendamentos: marcadas[0]?.n ?? 0,
        respostas: respostas[0]?.n ?? 0,
      }}
      handoffs={handoffs.map((h) => ({
        id: h.id,
        contato: h.contactName ?? h.phone,
        motivo: h.reason ?? "Sem motivo registrado",
      }))}
    />
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clinics, conversations, messages, patients } from "@/db/schema";
import { newId } from "@/lib/id";
import { replyAsIris } from "@/lib/iris";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Webhook do WhatsApp Cloud API.
 *
 * GET  — verificação do webhook pela Meta.
 * POST — mensagem recebida: grava, deixa a Íris responder e devolve a resposta
 *        ao paciente. Se a conversa estiver com a equipe, a IA fica calada e a
 *        mensagem só aparece no painel.
 */

export const runtime = "nodejs";

/** Só o recorte do payload da Meta que a Íris usa. */
type WebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        messages?: { from: string; type: string; text?: { body?: string } }[];
        contacts?: { profile?: { name?: string } }[];
      };
    }[];
  }[];
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("forbidden", { status: 403 });
}

/** Qual clínica atende este número. Hoje, uma instalação = uma clínica. */
async function resolveClinicId() {
  if (process.env.WHATSAPP_CLINIC_ID) return process.env.WHATSAPP_CLINIC_ID;
  const [first] = await db.select({ id: clinics.id }).from(clinics).orderBy(asc(clinics.createdAt)).limit(1);
  return first?.id ?? null;
}

export async function POST(request: NextRequest) {
  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const incoming = value?.messages?.[0];

  // Recibos de entrega e outros eventos chegam no mesmo webhook.
  if (!incoming || incoming.type !== "text") {
    return NextResponse.json({ ok: true });
  }

  const clinicId = await resolveClinicId();
  if (!clinicId) return NextResponse.json({ ok: true });

  const phone = incoming.from;
  const text = incoming.text?.body ?? "";
  const contactName = value?.contacts?.[0]?.profile?.name ?? null;

  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.clinicId, clinicId), eq(conversations.phone, phone)))
    .limit(1);

  let conversationId = existing?.id;

  if (!conversationId) {
    // Vincula ao cadastro do paciente quando o telefone já é conhecido.
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.clinicId, clinicId), eq(patients.phone, phone)))
      .limit(1);

    conversationId = newId("conv_");
    await db.insert(conversations).values({
      id: conversationId,
      clinicId,
      patientId: patient?.id ?? null,
      phone,
      contactName,
      status: "ai",
      lastMessageAt: new Date(),
    });
  }

  await db.insert(messages).values({
    id: newId("msg_"),
    conversationId,
    role: "patient",
    text,
  });

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), contactName: contactName ?? existing?.contactName ?? null })
    .where(eq(conversations.id, conversationId));

  const reply = await replyAsIris({ clinicId, conversationId, phone });
  if (reply) await sendWhatsAppMessage(phone, reply);

  return NextResponse.json({ ok: true });
}

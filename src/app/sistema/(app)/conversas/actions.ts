"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { saveAudio } from "@/lib/media";

/** A equipe assume a conversa; a Íris para de responder nela. */
export async function takeOver(conversationId: string, reason = "Assumido pela equipe") {
  const { clinic } = await requireSession();
  await db
    .update(conversations)
    .set({ status: "human", handoffReason: reason })
    .where(
      and(eq(conversations.clinicId, clinic.id), eq(conversations.id, conversationId)),
    );
  revalidatePath("/sistema/conversas");
  revalidatePath("/sistema");
}

/** Devolve o atendimento para a Íris. */
export async function returnToAi(conversationId: string) {
  const { clinic } = await requireSession();
  await db
    .update(conversations)
    .set({ status: "ai", handoffReason: null })
    .where(
      and(eq(conversations.clinicId, clinic.id), eq(conversations.id, conversationId)),
    );
  revalidatePath("/sistema/conversas");
  revalidatePath("/sistema");
}

export async function closeConversation(conversationId: string) {
  const { clinic } = await requireSession();
  await db
    .update(conversations)
    .set({ status: "closed" })
    .where(
      and(eq(conversations.clinicId, clinic.id), eq(conversations.id, conversationId)),
    );
  revalidatePath("/sistema/conversas");
}

/**
 * Registra uma mensagem enviada pela equipe. O envio efetivo ao WhatsApp
 * acontece no conector (src/lib/whatsapp.ts) quando ele está configurado.
 */
export async function sendStaffMessage(conversationId: string, text: string) {
  const { clinic } = await requireSession();
  const content = text.trim();
  if (!content) return;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.clinicId, clinic.id), eq(conversations.id, conversationId)),
    )
    .limit(1);
  if (!conversation) return;

  await db.insert(messages).values({
    id: newId("msg_"),
    conversationId,
    role: "staff",
    text: content,
  });

  await db
    .update(conversations)
    .set({ status: "human", lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
  await sendWhatsAppMessage(conversation.phone, content);

  revalidatePath("/sistema/conversas");
}

/**
 * Grava um áudio enviado pela equipe. O arquivo vai para data/media e a
 * mensagem guarda só o nome dele.
 */
export async function sendStaffAudio(conversationId: string, formData: FormData) {
  const { clinic } = await requireSession();

  const file = formData.get("audio");
  const durationMs = Number(formData.get("durationMs") ?? 0);
  if (!(file instanceof File)) return { error: "Áudio inválido." };

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.clinicId, clinic.id), eq(conversations.id, conversationId)),
    )
    .limit(1);
  if (!conversation) return { error: "Conversa não encontrada." };

  const id = newId("msg_");
  const mediaPath = await saveAudio(id, file);
  if (!mediaPath) return { error: "Formato de áudio não suportado ou arquivo muito grande." };

  await db.insert(messages).values({
    id,
    conversationId,
    role: "staff",
    kind: "audio",
    text: "",
    mediaPath,
    durationMs: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
  });

  await db
    .update(conversations)
    .set({ status: "human", lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  const { sendWhatsAppAudio } = await import("@/lib/whatsapp");
  await sendWhatsAppAudio(conversation.phone, mediaPath);

  revalidatePath("/sistema/conversas");
  return { ok: true };
}

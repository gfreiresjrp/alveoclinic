import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getConversationList, getMessages } from "@/lib/queries";
import { ChatScreen } from "./ChatScreen";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Conversas", robots: { index: false } };

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { clinic } = await requireSession();
  const { c } = await searchParams;

  const convs = await getConversationList(clinic.id);
  const active = convs.find((conv) => conv.id === c) ?? convs[0] ?? null;
  const thread = active ? await getMessages(active.id) : [];

  return (
    <ChatScreen
      connected={isWhatsAppConfigured()}
      /** Em telas estreitas, mostra a lista enquanto nenhuma conversa foi aberta. */
      explicitSelection={Boolean(c)}
      conversations={convs.map((conv) => ({
        id: conv.id,
        phone: conv.phone,
        contactName: conv.contactName,
        status: conv.status,
        handoffReason: conv.handoffReason,
        patientId: conv.patientId,
        lastText: conv.last ? (conv.last.kind === "audio" ? "🎤 Áudio" : conv.last.text) : null,
        lastRole: conv.last?.role ?? null,
        lastAt: conv.last?.createdAt.toISOString() ?? null,
      }))}
      active={
        active
          ? {
              id: active.id,
              phone: active.phone,
              contactName: active.contactName,
              status: active.status,
              handoffReason: active.handoffReason,
              patientId: active.patientId,
            }
          : null
      }
      messages={thread.map((m) => ({
        id: m.id,
        role: m.role,
        kind: m.kind,
        text: m.text,
        durationMs: m.durationMs,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}

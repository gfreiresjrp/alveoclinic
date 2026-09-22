import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { AppShell } from "@/components/app/AppShell";
import { requireSession } from "@/lib/session";
import { countNotifications } from "@/lib/notifications";

export default async function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clinic } = await requireSession();

  // Conversas que a Íris passou para a equipe e ainda ninguém respondeu.
  const [pending, notificacoes] = await Promise.all([
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.clinicId, clinic.id), eq(conversations.status, "human"))),
    countNotifications(clinic.id),
  ]);

  return (
    <AppShell
      user={{ name: user.name, role: user.role }}
      pendingConversations={pending.length}
      notifications={notificacoes}
    >
      {children}
    </AppShell>
  );
}

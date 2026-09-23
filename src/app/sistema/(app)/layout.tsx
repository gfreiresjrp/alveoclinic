import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { AppShell } from "@/components/app/AppShell";
import { requireSession } from "@/lib/session";
import { countNotifications } from "@/lib/notifications";

/**
 * Contagens dos pontinhos vermelhos do trilho.
 *
 * Custa sete consultas — a central de avisos é derivada do estado inteiro da
 * clínica. Por isso a promessa desce até o AppShell sem `await`: quem abre
 * "Financeiro" não tem por que esperar o sino para ver a tela.
 */
async function loadBadges(clinicId: string) {
  try {
    const [pendentes, notificacoes] = await Promise.all([
      // Conversas que a Íris passou para a equipe e ainda ninguém respondeu.
      db
        .select({ total: count() })
        .from(conversations)
        .where(and(eq(conversations.clinicId, clinicId), eq(conversations.status, "human"))),
      countNotifications(clinicId),
    ]);

    return { conversations: pendentes[0]?.total ?? 0, notifications: notificacoes };
  } catch (erro) {
    // Como ninguém aguarda esta promessa antes de renderizar, uma falha aqui
    // derrubaria a tela inteira por causa de dois pontinhos. Os avisos somem,
    // o sistema continua de pé.
    console.error("Falha ao contar os avisos do trilho:", erro);
    return { conversations: 0, notifications: 0 };
  }
}

export default async function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clinic } = await requireSession();

  return (
    <AppShell user={{ name: user.name, role: user.role }} badges={loadBadges(clinic.id)}>
      {children}
    </AppShell>
  );
}

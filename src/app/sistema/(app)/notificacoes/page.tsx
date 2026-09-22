import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { loadNotifications, sortNotifications } from "@/lib/notifications";
import { NotificationBoard } from "./NotificationBoard";

export const metadata: Metadata = { title: "Notificações", robots: { index: false } };

export default async function NotificacoesPage() {
  const { clinic } = await requireSession();
  const avisos = sortNotifications(await loadNotifications(clinic.id));

  return <NotificationBoard items={avisos} />;
}

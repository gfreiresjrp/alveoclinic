import "server-only";
import { cache } from "react";
import { and, asc, eq, lt, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  conversations,
  financeEntries,
  labCases,
  patientReminders,
  patients,
  stockItems,
  users,
} from "@/db/schema";
import { addDays, hhmm, isoDate, money, shortDate } from "./format";

/**
 * Central de avisos.
 *
 * Nada aqui é uma tabela de notificações: tudo é derivado do estado atual da
 * clínica. A vantagem é que o aviso some sozinho quando o problema é
 * resolvido — sem "marcar como lido" que mente, sem fila para limpar.
 *
 * O preço é que montar a lista custa seis consultas, e o layout pede a
 * contagem em toda navegação. Daí o `cache` do React: dentro de uma mesma
 * requisição o badge do sino e a tela de notificações dividem o mesmo
 * resultado.
 */

export type NotificationTone = "urgente" | "atencao" | "info";

export type Notification = {
  id: string;
  group: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  href: string;
  /** YYYY-MM-DD do que gerou o aviso, quando faz sentido ordenar por data. */
  date?: string;
};

export const loadNotifications = cache(async function loadNotifications(
  clinicId: string,
): Promise<Notification[]> {
  const hoje = isoDate(new Date());
  const amanha = addDays(hoje, 1);

  const [esperando, estoque, laboratorio, lembretes, vencidos, semConfirmar] = await Promise.all([
    db
      .select({
        id: conversations.id,
        contactName: conversations.contactName,
        phone: conversations.phone,
        reason: conversations.handoffReason,
      })
      .from(conversations)
      .where(and(eq(conversations.clinicId, clinicId), eq(conversations.status, "human")))
      .orderBy(asc(conversations.lastMessageAt)),

    db
      .select()
      .from(stockItems)
      .where(and(eq(stockItems.clinicId, clinicId), eq(stockItems.active, true)))
      .orderBy(asc(stockItems.name)),

    db
      .select({
        id: labCases.id,
        work: labCases.work,
        lab: labCases.lab,
        dueOn: labCases.dueOn,
        patient: patients.name,
      })
      .from(labCases)
      .innerJoin(patients, eq(patients.id, labCases.patientId))
      .where(and(eq(labCases.clinicId, clinicId), eq(labCases.status, "sent")))
      .orderBy(asc(labCases.dueOn)),

    db
      .select({
        id: patientReminders.id,
        note: patientReminders.note,
        dueDate: patientReminders.dueDate,
        patientId: patientReminders.patientId,
        patient: patients.name,
      })
      .from(patientReminders)
      .innerJoin(patients, eq(patients.id, patientReminders.patientId))
      .where(
        and(
          eq(patientReminders.clinicId, clinicId),
          eq(patientReminders.done, false),
          lte(patientReminders.dueDate, hoje),
        ),
      )
      .orderBy(asc(patientReminders.dueDate)),

    db
      .select()
      .from(financeEntries)
      .where(
        and(
          eq(financeEntries.clinicId, clinicId),
          eq(financeEntries.type, "income"),
          lt(financeEntries.dueDate, hoje),
        ),
      )
      .orderBy(asc(financeEntries.dueDate)),

    db
      .select({
        id: appointments.id,
        startMin: appointments.startMin,
        patient: patients.name,
        dentist: users.name,
      })
      .from(appointments)
      .innerJoin(patients, eq(patients.id, appointments.patientId))
      .innerJoin(users, eq(users.id, appointments.dentistId))
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.date, amanha),
          eq(appointments.status, "scheduled"),
        ),
      )
      .orderBy(asc(appointments.startMin)),
  ]);

  const avisos: Notification[] = [];

  for (const c of esperando) {
    avisos.push({
      id: `conv_${c.id}`,
      group: "Conversas",
      tone: "urgente",
      title: `${c.contactName ?? c.phone} está esperando a equipe`,
      detail: c.reason ?? "A Íris passou a conversa para um humano.",
      href: `/sistema/conversas?c=${c.id}`,
    });
  }

  for (const i of estoque) {
    if (i.quantity > i.minQuantity) continue;
    avisos.push({
      id: `stk_${i.id}`,
      group: "Estoque",
      tone: i.quantity === 0 ? "urgente" : "atencao",
      title: i.quantity === 0 ? `${i.name} acabou` : `${i.name} no mínimo`,
      detail:
        i.quantity === 0
          ? `Saldo zerado${i.supplier ? ` · ${i.supplier}` : ""}`
          : `${i.quantity} ${i.unit} em estoque, mínimo ${i.minQuantity}${
              i.supplier ? ` · ${i.supplier}` : ""
            }`,
      href: "/sistema/estoque",
    });
  }

  for (const l of laboratorio) {
    if (!l.dueOn || l.dueOn >= hoje) continue;
    avisos.push({
      id: `lab_${l.id}`,
      group: "Protéticos",
      tone: "atencao",
      title: `${l.work} de ${l.patient} passou do prazo`,
      detail: `${l.lab} · prazo era ${shortDate(l.dueOn)}`,
      href: "/sistema/proteticos",
      date: l.dueOn,
    });
  }

  for (const r of lembretes) {
    avisos.push({
      id: `rem_${r.id}`,
      group: "Lembretes",
      tone: r.dueDate < hoje ? "atencao" : "info",
      title: `${r.patient}: ${r.note}`,
      detail: r.dueDate < hoje ? `Venceu em ${shortDate(r.dueDate)}` : "Para hoje",
      href: `/sistema/pacientes/${r.patientId}`,
      date: r.dueDate,
    });
  }

  for (const e of vencidos) {
    const emAberto = e.paidAt ? 0 : e.amountCents - e.paidCents;
    if (emAberto <= 0) continue;
    avisos.push({
      id: `fin_${e.id}`,
      group: "Financeiro",
      tone: "atencao",
      title: `${e.description} está vencido`,
      detail: `${money(emAberto)} em aberto · venceu em ${shortDate(e.dueDate)}`,
      href: "/sistema/financeiro",
      date: e.dueDate,
    });
  }

  for (const a of semConfirmar) {
    avisos.push({
      id: `apt_${a.id}`,
      group: "Agenda",
      tone: "info",
      title: `${a.patient} amanhã às ${hhmm(a.startMin)} ainda não confirmou`,
      detail: a.dentist,
      href: "/sistema/agenda",
      date: amanha,
    });
  }

  return avisos;
});

const ORDEM: Record<NotificationTone, number> = { urgente: 0, atencao: 1, info: 2 };

export function sortNotifications(list: Notification[]) {
  return [...list].sort((a, b) => ORDEM[a.tone] - ORDEM[b.tone] || a.title.localeCompare(b.title));
}

/** Contagem para o badge do sino. */
export async function countNotifications(clinicId: string) {
  return (await loadNotifications(clinicId)).length;
}

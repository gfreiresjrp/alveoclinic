import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  chairs,
  clinicalNotes,
  conversations,
  documents,
  financeEntries,
  messages,
  patients,
  procedures,
  patientReminders,
  toothRecords,
  treatmentItems,
  treatmentPlans,
  users,
} from "@/db/schema";

/** Agendamentos de um intervalo, já com paciente, dentista e procedimento. */
export async function getAppointments(clinicId: string, from: string, to: string) {
  return db
    .select({
      id: appointments.id,
      date: appointments.date,
      startMin: appointments.startMin,
      endMin: appointments.endMin,
      status: appointments.status,
      source: appointments.source,
      notes: appointments.notes,
      reason: appointments.reason,
      statusNote: appointments.statusNote,
      patientId: patients.id,
      patientName: patients.name,
      patientPhone: patients.phone,
      dentistId: users.id,
      dentistName: users.name,
      dentistColor: users.color,
      procedureName: procedures.name,
      chairName: chairs.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(users, eq(users.id, appointments.dentistId))
    .leftJoin(procedures, eq(procedures.id, appointments.procedureId))
    .leftJoin(chairs, eq(chairs.id, appointments.chairId))
    .where(
      and(
        eq(appointments.clinicId, clinicId),
        gte(appointments.date, from),
        lte(appointments.date, to),
      ),
    )
    .orderBy(asc(appointments.date), asc(appointments.startMin));
}

export async function getDentists(clinicId: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.clinicId, clinicId), eq(users.role, "dentist"), eq(users.active, true)))
    .orderBy(asc(users.name));
}

export async function getTeam(clinicId: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.clinicId, clinicId))
    .orderBy(asc(users.role), asc(users.name));
}

export async function getChairs(clinicId: string) {
  return db
    .select()
    .from(chairs)
    .where(and(eq(chairs.clinicId, clinicId), eq(chairs.active, true)))
    .orderBy(asc(chairs.name));
}

export async function getProcedures(clinicId: string) {
  return db
    .select()
    .from(procedures)
    .where(and(eq(procedures.clinicId, clinicId), eq(procedures.active, true)))
    .orderBy(asc(procedures.specialty), asc(procedures.name));
}

export async function searchPatients(clinicId: string, term: string) {
  const where = term
    ? and(
        eq(patients.clinicId, clinicId),
        sql`(lower(${patients.name}) like ${"%" + term.toLowerCase() + "%"} or ${patients.phone} like ${"%" + term + "%"})`,
      )
    : eq(patients.clinicId, clinicId);

  return db.select().from(patients).where(where).orderBy(asc(patients.name)).limit(200);
}

export async function getPatient(clinicId: string, patientId: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.clinicId, clinicId), eq(patients.id, patientId)))
    .limit(1);
  return patient ?? null;
}

export async function getPatientHistory(clinicId: string, patientId: string) {
  const [history, notes, teeth, plans] = await Promise.all([
    db
      .select({
        id: appointments.id,
        date: appointments.date,
        startMin: appointments.startMin,
        status: appointments.status,
        source: appointments.source,
        procedureName: procedures.name,
        dentistName: users.name,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.dentistId))
      .leftJoin(procedures, eq(procedures.id, appointments.procedureId))
      .where(and(eq(appointments.clinicId, clinicId), eq(appointments.patientId, patientId)))
      .orderBy(desc(appointments.date), desc(appointments.startMin)),

    db
      .select({
        id: clinicalNotes.id,
        text: clinicalNotes.text,
        createdAt: clinicalNotes.createdAt,
        dentistName: users.name,
      })
      .from(clinicalNotes)
      .innerJoin(users, eq(users.id, clinicalNotes.dentistId))
      .where(and(eq(clinicalNotes.clinicId, clinicId), eq(clinicalNotes.patientId, patientId)))
      .orderBy(desc(clinicalNotes.createdAt)),

    db
      .select()
      .from(toothRecords)
      .where(and(eq(toothRecords.clinicId, clinicId), eq(toothRecords.patientId, patientId))),

    db
      .select({
        id: treatmentPlans.id,
        title: treatmentPlans.title,
        status: treatmentPlans.status,
        discountCents: treatmentPlans.discountCents,
        createdAt: treatmentPlans.createdAt,
        dentistName: users.name,
      })
      .from(treatmentPlans)
      .innerJoin(users, eq(users.id, treatmentPlans.dentistId))
      .where(and(eq(treatmentPlans.clinicId, clinicId), eq(treatmentPlans.patientId, patientId)))
      .orderBy(desc(treatmentPlans.createdAt)),
  ]);

  const planIds = plans.map((p) => p.id);
  const items = planIds.length
    ? await db
        .select({
          id: treatmentItems.id,
          planId: treatmentItems.planId,
          tooth: treatmentItems.tooth,
          faces: treatmentItems.faces,
          priceCents: treatmentItems.priceCents,
          status: treatmentItems.status,
          procedureName: procedures.name,
        })
        .from(treatmentItems)
        .innerJoin(procedures, eq(procedures.id, treatmentItems.procedureId))
        .where(inArray(treatmentItems.planId, planIds))
    : [];

  return { history, notes, teeth, plans, items };
}

export async function getFinance(clinicId: string, from: string, to: string) {
  return db
    .select({
      id: financeEntries.id,
      type: financeEntries.type,
      description: financeEntries.description,
      amountCents: financeEntries.amountCents,
      paidCents: financeEntries.paidCents,
      dueDate: financeEntries.dueDate,
      paidAt: financeEntries.paidAt,
      method: financeEntries.method,
      patientName: patients.name,
    })
    .from(financeEntries)
    .leftJoin(patients, eq(patients.id, financeEntries.patientId))
    .where(
      and(
        eq(financeEntries.clinicId, clinicId),
        gte(financeEntries.dueDate, from),
        lte(financeEntries.dueDate, to),
      ),
    )
    .orderBy(asc(financeEntries.dueDate));
}

/** Contas a receber já vencidas e ainda em aberto. */
export async function getOverdue(clinicId: string, today: string) {
  return db
    .select({
      id: financeEntries.id,
      description: financeEntries.description,
      amountCents: financeEntries.amountCents,
      dueDate: financeEntries.dueDate,
      patientName: patients.name,
    })
    .from(financeEntries)
    .leftJoin(patients, eq(patients.id, financeEntries.patientId))
    .where(
      and(
        eq(financeEntries.clinicId, clinicId),
        eq(financeEntries.type, "income"),
        isNull(financeEntries.paidAt),
        sql`${financeEntries.dueDate} < ${today}`,
      ),
    )
    .orderBy(asc(financeEntries.dueDate));
}

export async function getConversations(clinicId: string) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.clinicId, clinicId))
    .orderBy(desc(conversations.lastMessageAt));
}

/** Conversas com a última mensagem de cada uma, para a lista lateral. */
export async function getConversationList(clinicId: string) {
  const convs = await getConversations(clinicId);
  if (convs.length === 0) return [];

  const rows = await db
    .select({
      conversationId: messages.conversationId,
      role: messages.role,
      kind: messages.kind,
      text: messages.text,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.conversationId, convs.map((c) => c.id)))
    .orderBy(asc(messages.createdAt));

  // Percorrendo em ordem crescente, a última gravação de cada conversa fica.
  const last = new Map<string, (typeof rows)[number]>();
  for (const row of rows) last.set(row.conversationId, row);

  return convs.map((conv) => ({ ...conv, last: last.get(conv.id) ?? null }));
}

export async function getMessages(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function countPatients(clinicId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(patients)
    .where(eq(patients.clinicId, clinicId));
  return row?.total ?? 0;
}

/** Convênios distintos cadastrados, para o filtro da lista de pacientes. */
export async function getInsurances(clinicId: string) {
  const rows = await db
    .selectDistinct({ insurance: patients.insurance })
    .from(patients)
    .where(eq(patients.clinicId, clinicId));

  return rows
    .map((r) => r.insurance)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export type PatientRow = {
  id: string;
  name: string;
  phone: string;
  birthDate: string | null;
  insurance: string | null;
  healthNotes: string | null;
  createdAt: Date;
  lastVisit: string | null;
  nextVisit: string | null;
  openCents: number;
  overdueCents: number;
};

/**
 * Lista de pacientes com o que a recepção precisa ver de relance: última
 * visita, próximo retorno e quanto está em aberto. São três agregações
 * separadas porque o SQLite não faz tudo isso num join sem multiplicar linhas.
 */
export async function getPatientsOverview(
  clinicId: string,
  { term = "", insurance = "", today }: { term?: string; insurance?: string; today: string },
): Promise<PatientRow[]> {
  const base = await searchPatients(clinicId, term);
  const rows = insurance
    ? base.filter((p) =>
        insurance === "particular" ? !p.insurance : p.insurance === insurance,
      )
    : base;
  if (rows.length === 0) return [];

  const ids = rows.map((p) => p.id);

  const [visits, upcoming, debts] = await Promise.all([
    db
      .select({ patientId: appointments.patientId, last: sql<string>`max(${appointments.date})` })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          inArray(appointments.patientId, ids),
          eq(appointments.status, "attended"),
        ),
      )
      .groupBy(appointments.patientId),

    db
      .select({ patientId: appointments.patientId, next: sql<string>`min(${appointments.date})` })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          inArray(appointments.patientId, ids),
          gte(appointments.date, today),
          inArray(appointments.status, ["scheduled", "confirmed"]),
        ),
      )
      .groupBy(appointments.patientId),

    db
      .select({
        patientId: financeEntries.patientId,
        open: sql<number>`sum(${financeEntries.amountCents})`,
        overdue: sql<number>`sum(case when ${financeEntries.dueDate} < ${today} then ${financeEntries.amountCents} else 0 end)`,
      })
      .from(financeEntries)
      .where(
        and(
          eq(financeEntries.clinicId, clinicId),
          inArray(financeEntries.patientId, ids),
          eq(financeEntries.type, "income"),
          isNull(financeEntries.paidAt),
        ),
      )
      .groupBy(financeEntries.patientId),
  ]);

  const lastById = new Map(visits.map((v) => [v.patientId, v.last]));
  const nextById = new Map(upcoming.map((u) => [u.patientId, u.next]));
  const openById = new Map(debts.map((d) => [d.patientId, Number(d.open ?? 0)]));
  const overdueById = new Map(debts.map((d) => [d.patientId, Number(d.overdue ?? 0)]));

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    birthDate: p.birthDate,
    insurance: p.insurance,
    healthNotes: p.healthNotes,
    createdAt: p.createdAt,
    lastVisit: lastById.get(p.id) ?? null,
    nextVisit: nextById.get(p.id) ?? null,
    openCents: openById.get(p.id) ?? 0,
    overdueCents: overdueById.get(p.id) ?? 0,
  }));
}

/** Lançamentos financeiros de um paciente, do mais recente para o mais antigo. */
export async function getPatientFinance(clinicId: string, patientId: string) {
  return db
    .select()
    .from(financeEntries)
    .where(
      and(eq(financeEntries.clinicId, clinicId), eq(financeEntries.patientId, patientId)),
    )
    .orderBy(desc(financeEntries.dueDate));
}

/** Lembretes de um paciente, pendentes primeiro. */
export async function getPatientReminders(clinicId: string, patientId: string) {
  return db
    .select()
    .from(patientReminders)
    .where(
      and(
        eq(patientReminders.clinicId, clinicId),
        eq(patientReminders.patientId, patientId),
      ),
    )
    .orderBy(asc(patientReminders.done), asc(patientReminders.dueDate));
}

/** Lembretes que já venceram e ninguém deu baixa — vão para a visão geral. */
export async function getDueReminders(clinicId: string, today: string) {
  return db
    .select({
      id: patientReminders.id,
      dueDate: patientReminders.dueDate,
      note: patientReminders.note,
      patientId: patients.id,
      patientName: patients.name,
    })
    .from(patientReminders)
    .innerJoin(patients, eq(patients.id, patientReminders.patientId))
    .where(
      and(
        eq(patientReminders.clinicId, clinicId),
        eq(patientReminders.done, false),
        lte(patientReminders.dueDate, today),
      ),
    )
    .orderBy(asc(patientReminders.dueDate));
}

/** Documentos emitidos para o paciente, do mais recente para o mais antigo. */
export async function getPatientDocuments(clinicId: string, patientId: string) {
  return db
    .select({
      id: documents.id,
      kind: documents.kind,
      title: documents.title,
      body: documents.body,
      createdAt: documents.createdAt,
      authorName: users.name,
    })
    .from(documents)
    .innerJoin(users, eq(users.id, documents.authorId))
    .where(and(eq(documents.clinicId, clinicId), eq(documents.patientId, patientId)))
    .orderBy(desc(documents.createdAt));
}

/** Orçamentos que ainda não viraram tratamento — o dinheiro parado na mesa. */
export async function getOpenBudgets(clinicId: string) {
  const plans = await db
    .select({
      id: treatmentPlans.id,
      title: treatmentPlans.title,
      status: treatmentPlans.status,
      discountCents: treatmentPlans.discountCents,
      createdAt: treatmentPlans.createdAt,
      patientId: patients.id,
      patientName: patients.name,
      dentistName: users.name,
    })
    .from(treatmentPlans)
    .innerJoin(patients, eq(patients.id, treatmentPlans.patientId))
    .innerJoin(users, eq(users.id, treatmentPlans.dentistId))
    .where(
      and(
        eq(treatmentPlans.clinicId, clinicId),
        inArray(treatmentPlans.status, ["draft", "presented"]),
      ),
    )
    .orderBy(desc(treatmentPlans.createdAt));

  if (plans.length === 0) return [];

  const totals = await db
    .select({
      planId: treatmentItems.planId,
      total: sql<number>`sum(${treatmentItems.priceCents})`,
    })
    .from(treatmentItems)
    .where(inArray(treatmentItems.planId, plans.map((p) => p.id)))
    .groupBy(treatmentItems.planId);

  const byPlan = new Map(totals.map((t) => [t.planId, Number(t.total ?? 0)]));

  return plans.map((plan) => ({
    ...plan,
    totalCents: (byPlan.get(plan.id) ?? 0) - plan.discountCents,
  }));
}

/** Pacientes cadastrados num intervalo, para medir os canais de captação. */
export async function getPatientsCreatedBetween(clinicId: string, from: string, to: string) {
  const rows = await db
    .select({ source: patients.source, createdAt: patients.createdAt })
    .from(patients)
    .where(eq(patients.clinicId, clinicId));

  return rows.filter((r) => {
    const dia = isoDateOf(r.createdAt);
    return dia >= from && dia <= to;
  });
}

/** Converte timestamp para YYYY-MM-DD no fuso local, sem depender do cliente. */
function isoDateOf(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

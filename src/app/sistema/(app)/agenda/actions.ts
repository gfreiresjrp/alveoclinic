"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments, procedures } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { toMinutes } from "@/lib/format";

export type AgendaState = { error?: string; ok?: boolean };

/**
 * Cria um agendamento validando conflito de horário do dentista.
 * A mesma checagem vale para a recepção e para a Íris.
 */
export async function createAppointment(
  _prev: AgendaState,
  formData: FormData,
): Promise<AgendaState> {
  const { clinic } = await requireSession();

  const patientId = String(formData.get("patientId") ?? "");
  const dentistId = String(formData.get("dentistId") ?? "");
  const procedureId = String(formData.get("procedureId") ?? "");
  const chairId = String(formData.get("chairId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!patientId || !dentistId || !date || !time) {
    return { error: "Preencha paciente, dentista, data e horário." };
  }

  const [procedure] = procedureId
    ? await db.select().from(procedures).where(eq(procedures.id, procedureId)).limit(1)
    : [];

  const startMin = toMinutes(time);
  const endMin = startMin + (procedure?.durationMin ?? 30);

  // A equipe pode marcar em qualquer horário (encaixe, plantão, urgência).
  // O expediente da clínica continua valendo para a Íris, que só oferece
  // horários dentro dele — ver findFreeSlots em src/lib/availability.ts.
  if (endMin > 24 * 60) {
    return { error: "O atendimento passaria da meia-noite." };
  }

  const sameDay = await db
    .select({ startMin: appointments.startMin, endMin: appointments.endMin })
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, clinic.id),
        eq(appointments.dentistId, dentistId),
        eq(appointments.date, date),
        ne(appointments.status, "canceled"),
      ),
    );

  const overlaps = sameDay.some((a) => startMin < a.endMin && endMin > a.startMin);
  if (overlaps) {
    return { error: "Esse dentista já tem atendimento nesse horário." };
  }

  await db.insert(appointments).values({
    id: newId("apt_"),
    clinicId: clinic.id,
    patientId,
    dentistId,
    chairId,
    procedureId: procedureId || null,
    date,
    startMin,
    endMin,
    status: "scheduled",
    source: "staff",
    notes,
    reason,
  });

  revalidatePath("/sistema/agenda");
  revalidatePath("/sistema");
  return { ok: true };
}

const STATUSES = [
  "scheduled",
  "confirmed",
  "arrived",
  "attended",
  "noshow",
  "rescheduled",
  "canceled",
] as const;

type Status = (typeof STATUSES)[number];

/** Status que exigem justificativa escrita. */
const NEEDS_NOTE: Status[] = ["noshow", "rescheduled", "canceled"];

export async function setAppointmentStatus(id: string, status: string, note?: string) {
  const { clinic } = await requireSession();
  if (!STATUSES.includes(status as Status)) return { error: "Status inválido." };

  const typed = status as Status;
  const trimmed = (note ?? "").trim();
  if (NEEDS_NOTE.includes(typed) && trimmed.length < 3) {
    return { error: "Escreva o motivo." };
  }

  await db
    .update(appointments)
    .set({
      status: typed,
      statusNote: NEEDS_NOTE.includes(typed) ? trimmed : null,
      // "Na recepção" guarda a hora real da chegada, para medir a espera.
      arrivedAt: typed === "arrived" ? new Date() : undefined,
    })
    .where(and(eq(appointments.clinicId, clinic.id), eq(appointments.id, id)));

  revalidatePath("/sistema/agenda");
  revalidatePath("/sistema");
  return { ok: true };
}

import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { addDays, hhmm } from "./format";

export type FreeSlot = {
  date: string;
  time: string;
  startMin: number;
  dentistId: string;
  dentistName: string;
};

/**
 * Horários realmente livres, considerando o expediente da clínica, a duração do
 * procedimento e o que cada dentista já tem marcado. É a mesma fonte que a
 * recepção enxerga — por isso a Íris não marca em cima de ninguém.
 */
export async function findFreeSlots({
  clinicId,
  opening,
  closing,
  slot,
  durationMin,
  dentists,
  fromDate,
  days = 7,
  limit = 12,
}: {
  clinicId: string;
  opening: number;
  closing: number;
  slot: number;
  durationMin: number;
  dentists: { id: string; name: string }[];
  fromDate: string;
  days?: number;
  limit?: number;
}): Promise<FreeSlot[]> {
  const dates = Array.from({ length: days }, (_, i) => addDays(fromDate, i));

  const booked = await db
    .select({
      date: appointments.date,
      startMin: appointments.startMin,
      endMin: appointments.endMin,
      dentistId: appointments.dentistId,
    })
    .from(appointments)
    .where(and(eq(appointments.clinicId, clinicId), ne(appointments.status, "canceled")));

  const free: FreeSlot[] = [];

  for (const date of dates) {
    // Domingo fechado.
    const [y, m, d] = date.split("-").map(Number);
    if (new Date(y, m - 1, d).getDay() === 0) continue;

    for (let start = opening; start + durationMin <= closing; start += slot) {
      for (const dentist of dentists) {
        const busy = booked.some(
          (b) =>
            b.date === date &&
            b.dentistId === dentist.id &&
            start < b.endMin &&
            start + durationMin > b.startMin,
        );
        if (busy) continue;

        free.push({
          date,
          time: hhmm(start),
          startMin: start,
          dentistId: dentist.id,
          dentistName: dentist.name,
        });
        if (free.length >= limit) return free;
      }
    }
  }

  return free;
}

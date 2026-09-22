"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { labCases } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { isoDate } from "@/lib/format";

export async function createLabCase(data: {
  patientId: string;
  dentistId: string;
  lab: string;
  work: string;
  teeth: string;
  sentOn: string;
  dueOn: string;
  cost: string;
  note: string;
}) {
  const { clinic } = await requireSession();

  if (!data.patientId) return { error: "Escolha o paciente." };
  if (data.lab.trim().length < 2) return { error: "Informe o laboratório." };
  if (data.work.trim().length < 2) return { error: "Descreva o trabalho." };
  if (!data.sentOn) return { error: "Informe a data de envio." };

  const cost = Math.round(Number(data.cost.replace(".", "").replace(",", ".")) * 100);

  await db.insert(labCases).values({
    id: newId("lab_"),
    clinicId: clinic.id,
    patientId: data.patientId,
    dentistId: data.dentistId,
    lab: data.lab.trim(),
    work: data.work.trim(),
    teeth: data.teeth.trim() || null,
    sentOn: data.sentOn,
    dueOn: data.dueOn || null,
    costCents: Number.isFinite(cost) && cost > 0 ? cost : 0,
    note: data.note.trim() || null,
  });

  revalidatePath("/sistema/proteticos");
  return { ok: true };
}

/**
 * Move o caso pelo fluxo. "Voltou" e "Instalado" carimbam a data de retorno,
 * que é o que permite medir o prazo real de cada laboratório.
 */
export async function setLabStatus(
  caseId: string,
  status: "sent" | "returned" | "delivered" | "canceled",
) {
  const { clinic } = await requireSession();

  await db
    .update(labCases)
    .set({
      status,
      returnedOn:
        status === "returned" || status === "delivered" ? isoDate(new Date()) : null,
    })
    .where(and(eq(labCases.clinicId, clinic.id), eq(labCases.id, caseId)));

  revalidatePath("/sistema/proteticos");
  return { ok: true };
}

export async function deleteLabCase(caseId: string) {
  const { clinic } = await requireSession();

  await db
    .delete(labCases)
    .where(and(eq(labCases.clinicId, clinic.id), eq(labCases.id, caseId)));

  revalidatePath("/sistema/proteticos");
}

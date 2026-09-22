"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clinicalNotes, patientReminders, patients, toothRecords } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";

export type PatientState = { error?: string; ok?: boolean; id?: string };

export async function createPatient(
  _prev: PatientState,
  formData: FormData,
): Promise<PatientState> {
  const { clinic } = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 3) return { error: "Informe o nome completo do paciente." };
  if (phone.replace(/\D/g, "").length < 10) return { error: "Telefone inválido." };

  // Prontuário sequencial dentro da clínica: 1, 2, 3…
  const [{ maior }] = await db
    .select({ maior: sql<number>`coalesce(max(${patients.code}), 0)` })
    .from(patients)
    .where(eq(patients.clinicId, clinic.id));

  const id = newId("pat_");
  await db.insert(patients).values({
    id,
    clinicId: clinic.id,
    code: Number(maior) + 1,
    name,
    phone,
    source: String(formData.get("source") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    cpf: String(formData.get("cpf") ?? "").trim() || null,
    birthDate: String(formData.get("birthDate") ?? "") || null,
    address: String(formData.get("address") ?? "").trim() || null,
    insurance: String(formData.get("insurance") ?? "").trim() || null,
    healthNotes: String(formData.get("healthNotes") ?? "").trim() || null,
    notes: null,
  });

  revalidatePath("/sistema/pacientes");
  redirect(`/sistema/pacientes/${id}`);
}

/**
 * Marca a condição de um dente (ou de uma face). Uma condição por
 * dente+face: registrar de novo substitui a anterior.
 */
export async function setToothCondition(
  patientId: string,
  tooth: number,
  face: string | null,
  condition: string,
) {
  const { clinic } = await requireSession();

  const allowed = [
    "healthy", "caries", "restored", "root_canal",
    "crown", "implant", "extracted", "absent", "fracture",
  ] as const;
  type Condition = (typeof allowed)[number];
  if (!allowed.includes(condition as Condition)) return;

  const existing = await db
    .select({ id: toothRecords.id, face: toothRecords.face })
    .from(toothRecords)
    .where(
      and(
        eq(toothRecords.clinicId, clinic.id),
        eq(toothRecords.patientId, patientId),
        eq(toothRecords.tooth, tooth),
      ),
    );

  const match = existing.find((r) => (r.face ?? null) === face);

  // "Hígido" é a ausência de registro — limpa em vez de gravar.
  if (condition === "healthy") {
    if (match) await db.delete(toothRecords).where(eq(toothRecords.id, match.id));
    revalidatePath(`/sistema/pacientes/${patientId}`);
    return;
  }

  if (match) {
    await db
      .update(toothRecords)
      .set({ condition: condition as Condition, updatedAt: new Date() })
      .where(eq(toothRecords.id, match.id));
  } else {
    await db.insert(toothRecords).values({
      id: newId("th_"),
      clinicId: clinic.id,
      patientId,
      tooth,
      face,
      condition: condition as Condition,
      note: null,
    });
  }

  revalidatePath(`/sistema/pacientes/${patientId}`);
}

export async function addClinicalNote(patientId: string, text: string) {
  const { clinic, user } = await requireSession();
  const content = text.trim();
  if (content.length < 3) return;

  await db.insert(clinicalNotes).values({
    id: newId("cn_"),
    clinicId: clinic.id,
    patientId,
    appointmentId: null,
    dentistId: user.id,
    text: content,
  });

  revalidatePath(`/sistema/pacientes/${patientId}`);
}

/** Atualiza o cadastro do paciente a partir do diálogo de edição. */
export async function updatePatient(
  patientId: string,
  data: {
    name: string;
    phone: string;
    email: string;
    cpf: string;
    birthDate: string;
    address: string;
    insurance: string;
    healthNotes: string;
    source: string;
  },
) {
  const { clinic } = await requireSession();

  const name = data.name.trim();
  if (name.length < 3) return { error: "Informe o nome completo do paciente." };
  if (data.phone.replace(/\D/g, "").length < 10) return { error: "Telefone inválido." };

  await db
    .update(patients)
    .set({
      name,
      phone: data.phone.trim(),
      email: data.email.trim() || null,
      cpf: data.cpf.trim() || null,
      birthDate: data.birthDate || null,
      address: data.address.trim() || null,
      insurance: data.insurance.trim() || null,
      healthNotes: data.healthNotes.trim() || null,
      source: data.source.trim() || null,
    })
    .where(and(eq(patients.clinicId, clinic.id), eq(patients.id, patientId)));

  revalidatePath(`/sistema/pacientes/${patientId}`);
  revalidatePath("/sistema/pacientes");
  return { ok: true };
}

/** Lembrete preso ao paciente, com data de vencimento. */
export async function addReminder(patientId: string, dueDate: string, note: string) {
  const { clinic } = await requireSession();

  const texto = note.trim();
  if (texto.length < 3) return { error: "Escreva o lembrete." };
  if (!dueDate) return { error: "Escolha a data." };

  await db.insert(patientReminders).values({
    id: newId("rem_"),
    clinicId: clinic.id,
    patientId,
    dueDate,
    note: texto,
  });

  revalidatePath(`/sistema/pacientes/${patientId}`);
  revalidatePath("/sistema");
  return { ok: true };
}

export async function toggleReminder(reminderId: string, done: boolean) {
  const { clinic } = await requireSession();

  await db
    .update(patientReminders)
    .set({ done })
    .where(
      and(eq(patientReminders.clinicId, clinic.id), eq(patientReminders.id, reminderId)),
    );

  revalidatePath("/sistema");
  revalidatePath("/sistema/pacientes");
}

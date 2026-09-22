"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { getPatient } from "@/lib/queries";
import { isoDate } from "@/lib/format";
import {
  DOCUMENT_CATALOG,
  renderDocument,
  type DocumentKind,
} from "@/lib/documents";

/** Gera o rascunho do documento sem salvar — o profissional revisa antes. */
export async function draftDocument(
  patientId: string,
  kind: string,
  values: Record<string, string>,
) {
  const { clinic, user } = await requireSession();

  const model = DOCUMENT_CATALOG.find((d) => d.kind === kind);
  if (!model) return { error: "Tipo de documento desconhecido." };

  const patient = await getPatient(clinic.id, patientId);
  if (!patient) return { error: "Paciente não encontrado." };

  const body = renderDocument(kind as DocumentKind, values, {
    clinicName: clinic.name,
    clinicCnpj: clinic.cnpj,
    clinicAddress: clinic.address,
    cro: clinic.croResponsible,
    patientName: patient.name,
    patientCpf: patient.cpf,
    authorName: user.name,
    authorCro: user.cro,
    today: isoDate(new Date()),
  });

  return { title: model.title, body };
}

export async function saveDocument(
  patientId: string,
  kind: string,
  title: string,
  body: string,
) {
  const { clinic, user } = await requireSession();

  if (!DOCUMENT_CATALOG.some((d) => d.kind === kind)) {
    return { error: "Tipo de documento desconhecido." };
  }
  if (body.trim().length < 20) return { error: "O documento está vazio demais." };

  const id = newId("doc_");
  await db.insert(documents).values({
    id,
    clinicId: clinic.id,
    patientId,
    kind,
    title: title.trim() || "Documento",
    body: body.trim(),
    authorId: user.id,
  });

  revalidatePath(`/sistema/pacientes/${patientId}`);
  return { ok: true, id };
}

export async function deleteDocument(documentId: string, patientId: string) {
  const { clinic } = await requireSession();

  await db
    .delete(documents)
    .where(and(eq(documents.clinicId, clinic.id), eq(documents.id, documentId)));

  revalidatePath(`/sistema/pacientes/${patientId}`);
}

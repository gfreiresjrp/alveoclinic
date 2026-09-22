"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { financeEntries, payments } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { isoDate } from "@/lib/format";

export type FinanceState = { error?: string; ok?: boolean };

export async function createEntry(
  _prev: FinanceState,
  formData: FormData,
): Promise<FinanceState> {
  const { clinic } = await requireSession();

  const description = String(formData.get("description") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").replace(",", ".");
  const dueDate = String(formData.get("dueDate") ?? "");
  const type = String(formData.get("type") ?? "income");
  const patientId = String(formData.get("patientId") ?? "") || null;
  const method = String(formData.get("method") ?? "") || null;
  const paid = formData.get("paid") === "on";

  if (description.length < 3) return { error: "Descreva o lançamento." };
  const amountCents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { error: "Valor inválido." };
  if (!dueDate) return { error: "Informe o vencimento." };

  await db.insert(financeEntries).values({
    id: newId("fin_"),
    clinicId: clinic.id,
    patientId: type === "income" ? patientId : null,
    planId: null,
    type: type === "expense" ? "expense" : "income",
    description,
    amountCents,
    dueDate,
    paidAt: paid ? isoDate(new Date()) : null,
    method: method as never,
    installment: null,
    installments: null,
  });

  revalidatePath("/sistema/financeiro");
  revalidatePath("/sistema");
  return { ok: true };
}

/** Quita ou reabre um lançamento inteiro de uma vez. */
export async function togglePaid(id: string, paid: boolean) {
  const { clinic } = await requireSession();

  const [entry] = await db
    .select()
    .from(financeEntries)
    .where(and(eq(financeEntries.clinicId, clinic.id), eq(financeEntries.id, id)))
    .limit(1);
  if (!entry) return;

  if (paid) {
    await db
      .update(financeEntries)
      .set({ paidAt: isoDate(new Date()), paidCents: entry.amountCents })
      .where(eq(financeEntries.id, id));
  } else {
    // Reabrir apaga também os recebimentos avulsos: o saldo tem que bater.
    await db.delete(payments).where(eq(payments.entryId, id));
    await db
      .update(financeEntries)
      .set({ paidAt: null, paidCents: 0 })
      .where(eq(financeEntries.id, id));
  }

  revalidatePath("/sistema/financeiro");
  revalidatePath("/sistema");
}

/**
 * Registra um recebimento avulso. O paciente pode pagar em pedaços e em formas
 * diferentes — cada pedaço vira uma linha, e o lançamento só fecha quando a
 * soma alcança o total.
 */
export async function registerPayment(
  entryId: string,
  data: { amount: string; method: string; paidOn: string; note: string },
) {
  const { clinic } = await requireSession();

  const [entry] = await db
    .select()
    .from(financeEntries)
    .where(and(eq(financeEntries.clinicId, clinic.id), eq(financeEntries.id, entryId)))
    .limit(1);
  if (!entry) return { error: "Lançamento não encontrado." };

  const amountCents = Math.round(Number(data.amount.replace(",", ".")) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Valor inválido." };
  }

  const restante = entry.amountCents - entry.paidCents;
  if (amountCents > restante) {
    return { error: `O valor passa do que falta (${(restante / 100).toFixed(2)}).` };
  }
  if (!data.paidOn) return { error: "Informe a data do recebimento." };

  await db.insert(payments).values({
    id: newId("pay_"),
    clinicId: clinic.id,
    entryId,
    amountCents,
    method: (data.method || null) as never,
    paidOn: data.paidOn,
    note: data.note.trim() || null,
  });

  const total = entry.paidCents + amountCents;
  await db
    .update(financeEntries)
    .set({
      paidCents: total,
      // Só marca como pago quando o saldo zera.
      paidAt: total >= entry.amountCents ? data.paidOn : null,
    })
    .where(eq(financeEntries.id, entryId));

  revalidatePath("/sistema/financeiro");
  revalidatePath("/sistema");
  return { ok: true };
}

/** Remove um lançamento. Sem histórico: o registro sai do banco de vez. */
export async function deleteEntry(id: string) {
  const { clinic } = await requireSession();

  await db
    .delete(financeEntries)
    .where(and(eq(financeEntries.clinicId, clinic.id), eq(financeEntries.id, id)));

  revalidatePath("/sistema/financeiro");
  revalidatePath("/sistema");
}

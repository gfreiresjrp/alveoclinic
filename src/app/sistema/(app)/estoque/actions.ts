"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stockItems, stockMoves } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";

export async function createItem(data: {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  minQuantity: string;
  supplier: string;
}) {
  const { clinic, user } = await requireSession();

  const name = data.name.trim();
  if (name.length < 2) return { error: "Informe o nome do item." };

  const quantity = Math.max(0, Math.round(Number(data.quantity) || 0));
  const id = newId("stk_");

  await db.insert(stockItems).values({
    id,
    clinicId: clinic.id,
    name,
    category: data.category.trim() || null,
    unit: data.unit.trim() || "un",
    quantity,
    minQuantity: Math.max(0, Math.round(Number(data.minQuantity) || 0)),
    supplier: data.supplier.trim() || null,
  });

  // A quantidade inicial entra como movimento, para o histórico nascer completo.
  if (quantity > 0) {
    await db.insert(stockMoves).values({
      id: newId("mov_"),
      clinicId: clinic.id,
      itemId: id,
      kind: "in",
      quantity,
      note: "Saldo inicial",
      userId: user.id,
    });
  }

  revalidatePath("/sistema/estoque");
  return { ok: true };
}

/**
 * Registra entrada, saída ou acerto de contagem. O saldo do item é atualizado
 * junto — saída nunca deixa o estoque negativo.
 */
export async function registerMove(
  itemId: string,
  kind: "in" | "out" | "adjust",
  quantityRaw: string,
  note: string,
) {
  const { clinic, user } = await requireSession();

  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.clinicId, clinic.id), eq(stockItems.id, itemId)))
    .limit(1);
  if (!item) return { error: "Item não encontrado." };

  const quantity = Math.round(Number(quantityRaw));
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Quantidade inválida." };

  let saldo = item.quantity;
  if (kind === "in") saldo += quantity;
  else if (kind === "out") saldo -= quantity;
  else saldo = quantity;

  if (saldo < 0) {
    return { error: `Só há ${item.quantity} ${item.unit} em estoque.` };
  }

  await db.insert(stockMoves).values({
    id: newId("mov_"),
    clinicId: clinic.id,
    itemId,
    kind,
    quantity,
    note: note.trim() || null,
    userId: user.id,
  });

  await db.update(stockItems).set({ quantity: saldo }).where(eq(stockItems.id, itemId));

  revalidatePath("/sistema/estoque");
  return { ok: true, saldo };
}

export async function toggleItem(itemId: string, active: boolean) {
  const { clinic } = await requireSession();

  await db
    .update(stockItems)
    .set({ active })
    .where(and(eq(stockItems.clinicId, clinic.id), eq(stockItems.id, itemId)));

  revalidatePath("/sistema/estoque");
}

/** Itens no ou abaixo do mínimo — usado no alerta da visão geral. */
export async function countLowStock(clinicId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(stockItems)
    .where(
      and(
        eq(stockItems.clinicId, clinicId),
        eq(stockItems.active, true),
        sql`${stockItems.quantity} <= ${stockItems.minQuantity}`,
      ),
    );

  return Number(row?.total ?? 0);
}

import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { stockItems, stockMoves, users } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { StockBoard } from "./StockBoard";

export const metadata: Metadata = { title: "Estoque", robots: { index: false } };

export default async function EstoquePage() {
  const { clinic } = await requireSession();

  const [items, moves] = await Promise.all([
    db
      .select()
      .from(stockItems)
      .where(eq(stockItems.clinicId, clinic.id))
      .orderBy(asc(stockItems.name)),

    db
      .select({
        id: stockMoves.id,
        itemId: stockMoves.itemId,
        kind: stockMoves.kind,
        quantity: stockMoves.quantity,
        note: stockMoves.note,
        createdAt: stockMoves.createdAt,
        userName: users.name,
        itemName: stockItems.name,
        unit: stockItems.unit,
      })
      .from(stockMoves)
      .innerJoin(users, eq(users.id, stockMoves.userId))
      .innerJoin(stockItems, eq(stockItems.id, stockMoves.itemId))
      .where(eq(stockMoves.clinicId, clinic.id))
      .orderBy(desc(stockMoves.createdAt))
      .limit(30),
  ]);

  return (
    <StockBoard
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        quantity: i.quantity,
        minQuantity: i.minQuantity,
        supplier: i.supplier,
        active: i.active,
      }))}
      moves={moves.map((m) => ({
        id: m.id,
        kind: m.kind,
        quantity: m.quantity,
        note: m.note,
        createdAt: m.createdAt.toISOString(),
        userName: m.userName,
        itemName: m.itemName,
        unit: m.unit,
      }))}
    />
  );
}

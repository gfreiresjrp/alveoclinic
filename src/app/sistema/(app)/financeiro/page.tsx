import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getFinance, searchPatients } from "@/lib/queries";
import { isoDate } from "@/lib/format";
import { FinanceBoard } from "./FinanceBoard";

export const metadata: Metadata = { title: "Financeiro", robots: { index: false } };

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { clinic } = await requireSession();
  const { mes } = await searchParams;

  // "YYYY-MM" do mês pedido, ou o mês corrente.
  const month = mes ?? isoDate(new Date()).slice(0, 7);
  const from = `${month}-01`;
  const to = `${month}-31`;

  const [entries, patientRows] = await Promise.all([
    getFinance(clinic.id, from, to),
    searchPatients(clinic.id, ""),
  ]);

  return (
    <FinanceBoard
      month={month}
      today={isoDate(new Date())}
      entries={entries}
      patients={patientRows.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}

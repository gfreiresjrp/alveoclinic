import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import {
  getAppointments,
  getFinance,
  getOpenBudgets,
  getPatientsCreatedBetween,
} from "@/lib/queries";
import { Card, CardTitle, PageHeader, StatCard, EmptyState, Tag } from "@/components/app/ui";
import { addDays, isoDate, money, monthRange, shortDate } from "@/lib/format";
import { IconTrend } from "@/components/Icons";
import { PeriodPicker } from "./PeriodPicker";

export const metadata: Metadata = { title: "Relatórios", robots: { index: false } };

const PLAN_STATUS: Record<string, string> = {
  draft: "Rascunho",
  presented: "Apresentado",
};

/** Barra proporcional usada nas listas de ranking. */
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <span
        className="block h-full rounded-full bg-accent"
        style={{ width: `${max > 0 ? Math.max((value / max) * 100, 3) : 0}%` }}
      />
    </span>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; periodo?: string }>;
}) {
  const { clinic } = await requireSession();
  const params = await searchParams;

  const today = isoDate(new Date());
  const mes = monthRange(0);

  // Atalhos de período; "custom" usa as datas que vieram na URL.
  const presets: Record<string, { from: string; to: string }> = {
    mes: mes,
    "30d": { from: addDays(today, -29), to: today },
    "90d": { from: addDays(today, -89), to: today },
    ano: { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` },
  };

  const periodo = params.periodo ?? "mes";
  const range =
    periodo === "custom" && params.de && params.ate
      ? { from: params.de, to: params.ate }
      : presets[periodo] ?? mes;

  const [items, finance, budgets, newPatients] = await Promise.all([
    getAppointments(clinic.id, range.from, range.to),
    getFinance(clinic.id, range.from, range.to),
    getOpenBudgets(clinic.id),
    getPatientsCreatedBetween(clinic.id, range.from, range.to),
  ]);

  // ---- agenda ----
  const porStatus = new Map<string, number>();
  for (const a of items) porStatus.set(a.status, (porStatus.get(a.status) ?? 0) + 1);

  const atendidos = porStatus.get("attended") ?? 0;
  const faltas = porStatus.get("noshow") ?? 0;
  const encerrados = atendidos + faltas;
  const taxaFalta = encerrados ? Math.round((faltas / encerrados) * 100) : 0;
  const porIa = items.filter((a) => a.source === "ai").length;

  // ---- por dentista ----
  const porDentista = new Map<string, { total: number; atendidos: number; faltas: number }>();
  for (const a of items) {
    const atual = porDentista.get(a.dentistName) ?? { total: 0, atendidos: 0, faltas: 0 };
    atual.total += 1;
    if (a.status === "attended") atual.atendidos += 1;
    if (a.status === "noshow") atual.faltas += 1;
    porDentista.set(a.dentistName, atual);
  }
  const dentistas = [...porDentista.entries()].sort((a, b) => b[1].total - a[1].total);

  // ---- procedimentos ----
  const porProcedimento = new Map<string, number>();
  for (const a of items) {
    const nome = a.procedureName ?? "Consulta";
    porProcedimento.set(nome, (porProcedimento.get(nome) ?? 0) + 1);
  }
  const procedimentos = [...porProcedimento.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ---- captação ----
  const porCanal = new Map<string, number>();
  for (const p of newPatients) {
    const canal = p.source ?? "Não informado";
    porCanal.set(canal, (porCanal.get(canal) ?? 0) + 1);
  }
  const canais = [...porCanal.entries()].sort((a, b) => b[1] - a[1]);

  // ---- financeiro ----
  const entrou = (f: { paidAt: string | null; amountCents: number; paidCents: number }) =>
    f.paidAt ? f.amountCents : f.paidCents;

  const receitas = finance.filter((f) => f.type === "income");
  const recebido = receitas.reduce((s, f) => s + entrou(f), 0);
  const aReceber = receitas.reduce((s, f) => s + (f.amountCents - entrou(f)), 0);
  const despesas = finance
    .filter((f) => f.type === "expense")
    .reduce((s, f) => s + f.amountCents, 0);

  const budgetTotal = budgets.reduce((s, b) => s + b.totalCents, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios"
        subtitle={`${shortDate(range.from)} a ${shortDate(range.to)}`}
      />

      <PeriodPicker periodo={periodo} de={range.from} ate={range.to} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Agendamentos"
          value={String(items.length)}
          hint={`${porIa} pela ${"Íris"}`}
        />
        <StatCard
          label="Atendidos"
          value={String(atendidos)}
          hint={`${faltas} ${faltas === 1 ? "falta" : "faltas"} no período`}
        />
        <StatCard
          label="Taxa de falta"
          value={`${taxaFalta}%`}
          hint={`${encerrados} atendimentos encerrados`}
          tone={taxaFalta > 15 ? "danger" : taxaFalta > 8 ? "warning" : "default"}
        />
        <StatCard
          label="Recebido"
          value={money(recebido)}
          hint={`${money(aReceber)} a receber · ${money(despesas)} de despesa`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Atendimentos por dentista</CardTitle>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {dentistas.length === 0 ? (
              <EmptyState icon={<IconTrend className="h-9 w-9" />} title="Sem dados no período" />
            ) : (
              dentistas.map(([nome, dados]) => (
                <div key={nome} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-zinc-900">{nome}</p>
                    <p className="shrink-0 text-sm tabular-nums text-zinc-500">
                      {dados.atendidos} de {dados.total}
                      {dados.faltas > 0 && (
                        <span className="ml-2 text-rose-600">{dados.faltas} falta(s)</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Bar value={dados.total} max={dentistas[0][1].total} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Procedimentos mais frequentes</CardTitle>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {procedimentos.length === 0 ? (
              <EmptyState icon={<IconTrend className="h-9 w-9" />} title="Sem dados no período" />
            ) : (
              procedimentos.map(([nome, total]) => (
                <div key={nome} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-zinc-900">{nome}</p>
                    <p className="shrink-0 text-sm tabular-nums text-zinc-500">{total}</p>
                  </div>
                  <div className="mt-2">
                    <Bar value={total} max={procedimentos[0][1]} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Como nos conheceram</CardTitle>
            <p className="mt-0.5 text-sm text-zinc-500">
              {newPatients.length} {newPatients.length === 1 ? "paciente novo" : "pacientes novos"} no período
            </p>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {canais.length === 0 ? (
              <EmptyState
                icon={<IconTrend className="h-9 w-9" />}
                title="Nenhum paciente novo"
                text="Os canais aparecem conforme os cadastros entram."
              />
            ) : (
              canais.map(([canal, total]) => (
                <div key={canal} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-zinc-900">{canal}</p>
                    <p className="shrink-0 text-sm tabular-nums text-zinc-500">
                      {total} ({Math.round((total / newPatients.length) * 100)}%)
                    </p>
                  </div>
                  <div className="mt-2">
                    <Bar value={total} max={canais[0][1]} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <CardTitle>Orçamentos em aberto</CardTitle>
              <p className="mt-0.5 text-sm text-zinc-500">
                {budgets.length > 0
                  ? `${money(budgetTotal)} esperando resposta`
                  : "Nenhum orçamento parado"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {budgets.length === 0 ? (
              <EmptyState
                icon={<IconTrend className="h-9 w-9" />}
                title="Nada em aberto"
                text="Todo orçamento apresentado já teve resposta."
              />
            ) : (
              budgets.slice(0, 8).map((b) => (
                <Link
                  key={b.id}
                  href={`/sistema/pacientes/${b.patientId}?aba=orcamentos`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-900">{b.patientName}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {b.title} · {b.dentistName}
                    </p>
                  </div>
                  <Tag tone="pending">{PLAN_STATUS[b.status] ?? b.status}</Tag>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-900">
                    {money(b.totalCents)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="px-5 py-4">
          <CardTitle>Agendamentos por situação</CardTitle>
        </div>

        <div className="grid gap-px border-t border-zinc-100 bg-zinc-100 sm:grid-cols-3 xl:grid-cols-7">
          {[
            ["scheduled", "Agendado"],
            ["confirmed", "Confirmado"],
            ["arrived", "Na recepção"],
            ["attended", "Atendido"],
            ["noshow", "Faltou"],
            ["rescheduled", "Remarcou"],
            ["canceled", "Cancelado"],
          ].map(([key, label]) => (
            <div key={key} className="bg-white px-5 py-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="font-display mt-1 text-xl font-semibold text-zinc-900">
                {porStatus.get(key) ?? 0}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

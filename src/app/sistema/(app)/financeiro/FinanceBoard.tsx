"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, StatCard, Card, Tag, EmptyState, Dialog } from "@/components/app/ui";
import { IconPlus, IconCheck, IconTrash, IconSearch, IconClose } from "@/components/Icons";
import { money, shortDate } from "@/lib/format";
import { createEntry, togglePaid, deleteEntry, registerPayment } from "./actions";

type Entry = {
  id: string;
  type: string;
  description: string;
  amountCents: number;
  paidCents: number;
  dueDate: string;
  paidAt: string | null;
  method: string | null;
  patientName: string | null;
};

const METHODS: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  transfer: "Transferência",
  insurance: "Convênio",
};

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const sum = (list: Entry[]) => list.reduce((total, e) => total + e.amountCents, 0);

/**
 * Quanto de fato entrou de um lançamento. Quitado vale pelo total — registros
 * antigos, anteriores ao recebimento parcial, têm paidAt sem paidCents.
 */
const receivedOf = (e: Entry) => (e.paidAt ? e.amountCents : e.paidCents);

export function FinanceBoard({
  month,
  today,
  entries,
  patients,
}: {
  month: string;
  today: string;
  entries: Entry[];
  patients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<Entry | null>(null);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [term, setTerm] = useState("");

  function statusOf(entry: Entry) {
    if (entry.paidAt) return "paid";
    if (entry.paidCents > 0) return "partial";
    if (entry.dueDate < today) return "late";
    return "due";
  }

  const income = entries.filter((e) => e.type === "income");
  const expense = entries.filter((e) => e.type === "expense");

  // Recebido conta o que entrou de fato, inclusive de parcelas pagas pela metade.
  const received = income.reduce((total, e) => total + receivedOf(e), 0);
  const toReceive = income.reduce((total, e) => total + (e.amountCents - receivedOf(e)), 0);
  const overdue = income
    .filter((e) => !e.paidAt && e.dueDate < today)
    .reduce((total, e) => total + (e.amountCents - receivedOf(e)), 0);
  const expenses = sum(expense);
  const expensesPaid = expense.reduce((total, e) => total + receivedOf(e), 0);
  // Resultado em regime de caixa: o que entrou menos o que saiu de fato.
  const result = received - expensesPaid;

  // Quanto do faturamento previsto no mês já entrou.
  const expected = received + toReceive;
  const receivedShare = expected > 0 ? Math.round((received / expected) * 100) : 0;

  // Quanto entrou por forma de pagamento — só do que já foi pago.
  const byMethod = Object.entries(METHODS)
    .map(([key, label]) => ({
      label,
      total: income
        .filter((e) => e.method === key)
        .reduce((total, e) => total + receivedOf(e), 0),
    }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

  const filtered = entries.filter((e) => {
    if (type && e.type !== type) return false;
    if (status && statusOf(e) !== status) return false;
    if (method && e.method !== method) return false;
    if (term) {
      const haystack = `${e.description} ${e.patientName ?? ""}`.toLowerCase();
      if (!haystack.includes(term.trim().toLowerCase())) return false;
    }
    return true;
  });

  const filtersOn = Boolean(type || status || method || term);
  const filteredIncome = sum(filtered.filter((e) => e.type === "income"));
  const filteredExpense = sum(filtered.filter((e) => e.type === "expense"));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financeiro"
        subtitle={monthLabel(month)}
        action={
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
            <IconPlus className="h-4 w-4" />
            Novo lançamento
          </button>
        }
      />

      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => router.push(`/sistema/financeiro?mes=${shiftMonth(month, -1)}`)}
          className="cursor-pointer rounded-md px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => router.push(`/sistema/financeiro?mes=${today.slice(0, 7)}`)}
          className="cursor-pointer rounded-md px-3 py-1 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Mês atual
        </button>
        <button
          type="button"
          onClick={() => router.push(`/sistema/financeiro?mes=${shiftMonth(month, 1)}`)}
          className="cursor-pointer rounded-md px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {/* Um número e uma linha de apoio por card — nada além disso. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recebido"
          value={money(received)}
          hint={expected > 0 ? `${receivedShare}% do previsto` : "sem previsão no mês"}
        />
        <StatCard
          label="A receber"
          value={money(toReceive)}
          hint={overdue > 0 ? `${money(overdue)} vencido` : "nada vencido"}
        />
        <StatCard
          label="Despesas"
          value={money(expenses)}
          hint={expensesPaid === expenses ? "todas pagas" : `${money(expenses - expensesPaid)} em aberto`}
        />
        <StatCard
          label="Resultado em caixa"
          value={money(result)}
          hint="recebido − despesas pagas"
          tone={result < 0 ? "danger" : "default"}
        />
      </div>

      {byMethod.length > 0 && (
        <Card className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Recebido por forma
          </span>
          {byMethod.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-zinc-500">{m.label}</p>
              <p className="font-display text-base font-semibold tabular-nums text-zinc-900">
                {money(m.total)}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={(e) => e.preventDefault()} className="relative w-60">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar descrição ou paciente"
            className="field field-sm field-icon"
          />
        </form>

        <div className="inline-flex items-center rounded-lg border border-zinc-200 p-0.5">
          {[
            ["", "Tudo"],
            ["income", "Receitas"],
            ["expense", "Despesas"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                type === key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field field-sm field-auto cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="due">A vencer</option>
          <option value="late">Vencido</option>
        </select>

        <select
          aria-label="Forma de pagamento"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="field field-sm field-auto cursor-pointer"
        >
          <option value="">Todas as formas</option>
          {Object.entries(METHODS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {filtersOn && (
          <button
            type="button"
            onClick={() => {
              setType("");
              setStatus("");
              setMethod("");
              setTerm("");
            }}
            className="inline-flex cursor-pointer items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-700"
          >
            <IconClose className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}

        <span className="ml-auto text-[13px] text-zinc-400">
          {filtered.length} de {entries.length} lançamentos
        </span>
      </div>

      {/* tabela */}
      <Card className="p-0">
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              art="/illustrations/no-data.svg"
              title="Nenhum lançamento"
              text={filtersOn ? "Ajuste os filtros para ver outros." : "Nada registrado neste mês."}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[64px_1fr_104px_132px_88px_132px] items-center gap-4 border-b border-zinc-100 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              <span>Venc.</span>
              <span>Descrição</span>
              <span>Forma</span>
              <span className="text-right">Valor</span>
              <span>Status</span>
              <span />
            </div>

            <div className="divide-y divide-zinc-100">
              {filtered.map((e) => {
                const state = statusOf(e);
                return (
                  <div
                    key={e.id}
                    className="group grid grid-cols-[64px_1fr_104px_132px_88px_132px] items-center gap-4 px-5 py-3"
                  >
                    <span className="text-xs text-zinc-500">{shortDate(e.dueDate).slice(0, 5)}</span>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-900">{e.description}</p>
                      {e.patientName && (
                        <p className="truncate text-xs text-zinc-400">{e.patientName}</p>
                      )}
                    </div>

                    <span className="truncate text-xs text-zinc-500">
                      {e.method ? METHODS[e.method] : "—"}
                    </span>

                    <span
                      className={`text-right text-sm font-medium tabular-nums ${
                        e.type === "income" ? "text-zinc-900" : "text-zinc-500"
                      }`}
                    >
                      {e.type === "income" ? "" : "− "}
                      {money(e.amountCents)}
                      {state === "partial" && (
                        <span className="block text-[11px] font-normal text-sky-700">
                          {money(e.paidCents)} recebido
                        </span>
                      )}
                    </span>

                    <span>
                      <Tag tone={state}>
                        {state === "paid"
                          ? "Pago"
                          : state === "partial"
                            ? "Parcial"
                            : state === "late"
                              ? "Vencido"
                              : "A vencer"}
                      </Tag>
                    </span>

                    <div className="flex justify-end gap-1">
                      {confirmDelete === e.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await deleteEntry(e.id);
                                setConfirmDelete(null);
                              })
                            }
                            className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-zinc-400"
                          >
                            não
                          </button>
                        </div>
                      ) : (
                        <>
                          {e.type === "income" && !e.paidAt && (
                            <button
                              type="button"
                              onClick={() => setReceiving(e)}
                              className="cursor-pointer rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                              title="Registrar um recebimento"
                            >
                              Receber
                            </button>
                          )}
                          {e.type === "income" && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                startTransition(async () => {
                                  await togglePaid(e.id, !e.paidAt);
                                })
                              }
                              className={`cursor-pointer rounded-md p-1.5 transition-colors disabled:opacity-40 ${
                                e.paidAt
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-zinc-300 hover:bg-zinc-100 hover:text-emerald-600"
                              }`}
                              aria-label={e.paidAt ? "Marcar como em aberto" : "Marcar como pago"}
                              title={e.paidAt ? "Marcar como em aberto" : "Marcar como pago"}
                            >
                              <IconCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(e.id)}
                            className="cursor-pointer rounded-md p-1.5 text-zinc-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                            aria-label="Excluir lançamento"
                            title="Excluir lançamento"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[64px_1fr_104px_132px_88px_132px] items-center gap-4 border-t border-zinc-200 px-5 py-3 text-sm">
              <span />
              <span className="text-xs text-zinc-400">
                {filtersOn ? "Total do filtro" : "Total do mês"}
              </span>
              <span />
              <span className="text-right font-semibold tabular-nums text-zinc-900">
                {money(filteredIncome - filteredExpense)}
              </span>
              <span className="text-[11px] text-zinc-400">
                {money(filteredIncome)} − {money(filteredExpense)}
              </span>
              <span />
            </div>
          </>
        )}
      </Card>

      {open && <NewEntryDialog onClose={() => setOpen(false)} patients={patients} today={today} />}

      {receiving && (
        <ReceiveDialog entry={receiving} today={today} onClose={() => setReceiving(null)} />
      )}
    </div>
  );
}

function NewEntryDialog({
  onClose,
  patients,
  today,
}: {
  onClose: () => void;
  patients: { id: string; name: string }[];
  today: string;
}) {
  const [type, setType] = useState("income");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // onSubmit preserva o que foi digitado quando a action devolve erro.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createEntry({}, formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Dialog title="Novo lançamento" onClose={onClose}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {[
            ["income", "Receita"],
            ["expense", "Despesa"],
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                type === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />

        <div>
          <label className="label-field" htmlFor="description">
            Descrição
          </label>
          <input
            id="description"
            name="description"
            required
            className="field"
            placeholder="Coroa de porcelana — João"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="amount">
              Valor (R$)
            </label>
            <input
              id="amount"
              name="amount"
              required
              inputMode="decimal"
              className="field"
              placeholder="280,00"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="dueDate">
              Vencimento
            </label>
            <input
              id="dueDate"
              type="date"
              name="dueDate"
              required
              defaultValue={today}
              className="field"
            />
          </div>
        </div>

        {type === "income" && (
          <>
            <div>
              <label className="label-field" htmlFor="patientId">
                Paciente
              </label>
              <select id="patientId" name="patientId" defaultValue="" className="field">
                <option value="">Sem vínculo</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field" htmlFor="method">
                Forma de pagamento
              </label>
              <select id="method" name="method" defaultValue="" className="field">
                <option value="">Não definida</option>
                {Object.entries(METHODS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 px-3.5 py-2.5">
          <input type="checkbox" name="paid" className="h-4 w-4 accent-[#2563eb]" />
          <span className="text-sm text-zinc-700">Já foi pago</span>
        </label>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando…" : "Lançar"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Recebimento avulso: o paciente paga um pedaço, na forma que quiser. */
function ReceiveDialog({
  entry,
  today,
  onClose,
}: {
  entry: Entry;
  today: string;
  onClose: () => void;
}) {
  const restante = entry.amountCents - entry.paidCents;
  const [amount, setAmount] = useState((restante / 100).toFixed(2).replace(".", ","));
  const [method, setMethod] = useState(entry.method ?? "");
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await registerPayment(entry.id, { amount, method, paidOn, note });
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Dialog title="Registrar recebimento" onClose={onClose}>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
        <p className="font-medium text-zinc-900">{entry.description}</p>
        <p className="mt-1 text-zinc-500">
          Total {money(entry.amountCents)}
          {entry.paidCents > 0 && ` · já recebido ${money(entry.paidCents)}`} · falta{" "}
          <strong className="font-semibold text-zinc-900">{money(restante)}</strong>
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="pay-amount">
              Valor recebido (R$)
            </label>
            <input
              id="pay-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="pay-date">
              Data
            </label>
            <input
              id="pay-date"
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="pay-method">
            Forma de pagamento
          </label>
          <select
            id="pay-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="field"
          >
            <option value="">Não definida</option>
            {Object.entries(METHODS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field" htmlFor="pay-note">
            Observação
          </label>
          <input
            id="pay-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
            placeholder="Entrada do tratamento, 2ª parcela…"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
            {pending ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

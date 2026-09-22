"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, Dialog, EmptyState, PageHeader, StatCard, Tag } from "@/components/app/ui";
import { IconPlus, IconTrash, IconAlert } from "@/components/Icons";
import { money, shortDate } from "@/lib/format";
import { createLabCase, setLabStatus, deleteLabCase } from "./actions";

type LabCase = {
  id: string;
  lab: string;
  work: string;
  teeth: string | null;
  status: string;
  sentOn: string;
  dueOn: string | null;
  returnedOn: string | null;
  costCents: number;
  note: string | null;
  patientId: string;
  patientName: string;
  dentistName: string;
};

const STATUS_LABEL: Record<string, string> = {
  sent: "No laboratório",
  returned: "Voltou",
  delivered: "Instalado",
  canceled: "Cancelado",
};

const FILTERS = [
  { key: "abertos", label: "Em andamento" },
  { key: "sent", label: "No laboratório" },
  { key: "returned", label: "Voltou" },
  { key: "delivered", label: "Instalado" },
  { key: "todos", label: "Todos" },
] as const;

export function LabBoard({
  cases,
  dentists,
  patients,
  today,
}: {
  cases: LabCase[];
  dentists: { id: string; name: string }[];
  patients: { id: string; name: string }[];
  today: string;
}) {
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string>("abertos");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /** Atrasado: passou do prazo e ainda não voltou do laboratório. */
  const atrasado = (c: LabCase) =>
    c.status === "sent" && c.dueOn !== null && c.dueOn < today;

  const noLab = cases.filter((c) => c.status === "sent");
  const atrasados = cases.filter(atrasado);
  const aInstalar = cases.filter((c) => c.status === "returned");

  const visiveis = cases.filter((c) => {
    if (filter === "todos") return true;
    if (filter === "abertos") return c.status === "sent" || c.status === "returned";
    return c.status === filter;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Protéticos"
        subtitle="Trabalhos enviados ao laboratório"
        action={
          <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
            <IconPlus className="h-4 w-4" />
            Novo envio
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="No laboratório" value={String(noLab.length)} />
        <StatCard
          label="Atrasados"
          value={String(atrasados.length)}
          hint={atrasados.length > 0 ? "passaram do prazo" : "nenhum fora do prazo"}
          tone={atrasados.length > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Esperando instalação"
          value={String(aInstalar.length)}
          tone={aInstalar.length > 0 ? "warning" : "default"}
        />
      </div>

      {atrasados.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900">
            <strong className="font-semibold">
              {atrasados.length} {atrasados.length === 1 ? "trabalho passou" : "trabalhos passaram"}
            </strong>{" "}
            do prazo: {atrasados.slice(0, 3).map((c) => `${c.patientName} (${c.lab})`).join(", ")}.
          </p>
        </div>
      )}

      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
              filter === f.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {visiveis.length === 0 ? (
          <div className="p-5">
            <EmptyState
              art="/illustrations/no-data.svg"
              title="Nenhum trabalho aqui"
              text="Registre o primeiro envio ao laboratório."
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {visiveis.map((c) => {
              const late = atrasado(c);
              return (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">
                        <Link
                          href={`/sistema/pacientes/${c.patientId}`}
                          className="hover:text-accent hover:underline"
                        >
                          {c.patientName}
                        </Link>
                        <span className="ml-2 font-normal text-zinc-500">
                          {c.work}
                          {c.teeth && ` · dentes ${c.teeth}`}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {c.lab} · {c.dentistName} · enviado {shortDate(c.sentOn)}
                        {c.dueOn && ` · prazo ${shortDate(c.dueOn)}`}
                        {c.returnedOn && ` · voltou ${shortDate(c.returnedOn)}`}
                      </p>
                      {c.note && <p className="mt-1 text-xs text-zinc-400">{c.note}</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {c.costCents > 0 && (
                        <span className="text-sm tabular-nums text-zinc-600">
                          {money(c.costCents)}
                        </span>
                      )}
                      {late ? (
                        <Tag tone="late">atrasado</Tag>
                      ) : (
                        <Tag
                          tone={
                            c.status === "delivered"
                              ? "done"
                              : c.status === "returned"
                                ? "due"
                                : c.status === "canceled"
                                  ? "canceled"
                                  : "confirmed"
                          }
                        >
                          {STATUS_LABEL[c.status]}
                        </Tag>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {c.status === "sent" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await setLabStatus(c.id, "returned");
                          })
                        }
                        className="cursor-pointer rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-accent hover:text-accent"
                      >
                        Voltou do laboratório
                      </button>
                    )}

                    {c.status === "returned" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await setLabStatus(c.id, "delivered");
                          })
                        }
                        className="cursor-pointer rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Instalado no paciente
                      </button>
                    )}

                    {c.status !== "canceled" && c.status !== "delivered" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await setLabStatus(c.id, "canceled");
                          })
                        }
                        className="cursor-pointer rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-700"
                      >
                        Cancelar
                      </button>
                    )}

                    {confirmDelete === c.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteLabCase(c.id);
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
                          className="cursor-pointer px-1 text-[11px] text-zinc-400"
                        >
                          não
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(c.id)}
                        aria-label="Excluir registro"
                        className="ml-auto cursor-pointer rounded-md p-1.5 text-zinc-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {creating && (
        <CreateDialog
          today={today}
          dentists={dentists}
          patients={patients}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function CreateDialog({
  today,
  dentists,
  patients,
  onClose,
}: {
  today: string;
  dentists: { id: string; name: string }[];
  patients: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    patientId: "",
    dentistId: dentists[0]?.id ?? "",
    lab: "",
    work: "",
    teeth: "",
    sentOn: today,
    dueOn: "",
    cost: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <Dialog title="Novo envio ao laboratório" onClose={onClose}>
      <div className="mt-5 space-y-4">
        <div>
          <label className="label-field" htmlFor="lab-patient">
            Paciente
          </label>
          <select
            id="lab-patient"
            value={form.patientId}
            onChange={(e) => set("patientId", e.target.value)}
            className="field"
          >
            <option value="">Selecione</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="lab-dentist">
              Dentista
            </label>
            <select
              id="lab-dentist"
              value={form.dentistId}
              onChange={(e) => set("dentistId", e.target.value)}
              className="field"
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="lab-name">
              Laboratório
            </label>
            <input
              id="lab-name"
              value={form.lab}
              onChange={(e) => set("lab", e.target.value)}
              className="field"
              placeholder="Prótese Arte Dental"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="lab-work">
              Trabalho
            </label>
            <input
              id="lab-work"
              value={form.work}
              onChange={(e) => set("work", e.target.value)}
              className="field"
              placeholder="Coroa de porcelana"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="lab-teeth">
              Dentes
            </label>
            <input
              id="lab-teeth"
              value={form.teeth}
              onChange={(e) => set("teeth", e.target.value)}
              className="field"
              placeholder="36, 37"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-field" htmlFor="lab-sent">
              Enviado em
            </label>
            <input
              id="lab-sent"
              type="date"
              value={form.sentOn}
              onChange={(e) => set("sentOn", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="lab-due">
              Prazo
            </label>
            <input
              id="lab-due"
              type="date"
              value={form.dueOn}
              onChange={(e) => set("dueOn", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="lab-cost">
              Custo (R$)
            </label>
            <input
              id="lab-cost"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              inputMode="decimal"
              className="field"
              placeholder="380,00"
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="lab-note">
            Observação
          </label>
          <input
            id="lab-note"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            className="field"
            placeholder="Cor A2, enviar modelo junto"
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
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await createLabCase(form);
                if (result?.error) setError(result.error);
                else onClose();
              })
            }
            className="btn btn-primary"
          >
            {pending ? "Salvando…" : "Registrar envio"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog, Tag } from "@/components/app/ui";
import { IconAlert, IconWhatsApp, IconCalendar } from "@/components/Icons";
import { initials, phoneMask } from "@/lib/format";
import { updatePatient } from "../actions";

export const SOURCES = [
  "Indicação de paciente",
  "Instagram",
  "Facebook",
  "Google",
  "Placa / fachada",
  "Panfleto",
  "Convênio",
  "Outro",
];

export type PatientData = {
  id: string;
  code: number | null;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  birthDate: string | null;
  address: string | null;
  insurance: string | null;
  healthNotes: string | null;
  source: string | null;
};

export const TABS = [
  { key: "visao-geral", label: "Visão geral" },
  { key: "anamnese", label: "Anamnese" },
  { key: "orcamentos", label: "Orçamentos" },
  { key: "tratamentos", label: "Tratamentos" },
  { key: "pagamentos", label: "Pagamentos" },
  { key: "evolucoes", label: "Evoluções" },
  { key: "documentos", label: "Documentos" },
] as const;

export function PatientHeader({
  patient,
  age,
  daysToBirthday,
  counts,
  active,
}: {
  patient: PatientData;
  age: string | null;
  daysToBirthday: number | null;
  counts: Record<string, number>;
  active: string;
}) {
  const [editing, setEditing] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();

  function href(tab: string) {
    const next = new URLSearchParams(params.toString());
    if (tab === "visao-geral") next.delete("aba");
    else next.set("aba", tab);
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const birthdayLabel =
    daysToBirthday === null
      ? null
      : daysToBirthday === 0
        ? "Aniversário hoje"
        : daysToBirthday === 1
          ? "Aniversário amanhã"
          : daysToBirthday <= 7
            ? `Aniversário em ${daysToBirthday} dias`
            : null;

  return (
    <div className="panel p-0">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-zinc-100 text-base font-semibold text-zinc-500">
          {initials(patient.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900">
              {patient.name}
            </h1>

            {patient.healthNotes && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                <IconAlert className="h-3 w-3" />
                Alerta de saúde
              </span>
            )}

            {birthdayLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                <IconCalendar className="h-3 w-3" />
                {birthdayLabel}
              </span>
            )}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            <a
              href={`https://wa.me/55${patient.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 hover:text-accent"
            >
              <IconWhatsApp className="h-3.5 w-3.5" />
              {patient.phone}
            </a>
            {patient.code !== null && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
                Prontuário {String(patient.code).padStart(4, "0")}
              </span>
            )}
            {patient.cpf && <span>CPF {patient.cpf}</span>}
            {age && <span>{age}</span>}
            <span>{patient.insurance ?? "Particular"}</span>
          </p>
        </div>

        <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary">
          Editar
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-3 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key] ?? 0;

          return (
            <Link
              key={tab.key}
              href={href(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm transition-colors ${
                isActive
                  ? "border-accent font-semibold text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold ${
                    isActive ? "bg-accent text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {editing && <EditDialog patient={patient} onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditDialog({
  patient,
  onClose,
}: {
  patient: PatientData;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: patient.name,
    phone: patient.phone,
    email: patient.email ?? "",
    cpf: patient.cpf ?? "",
    birthDate: patient.birthDate ?? "",
    address: patient.address ?? "",
    insurance: patient.insurance ?? "",
    healthNotes: patient.healthNotes ?? "",
    source: patient.source ?? "",
  });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await updatePatient(patient.id, form);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Dialog title="Editar paciente" onClose={onClose}>
      <div className="mt-5 space-y-4">
        <div>
          <label className="label-field" htmlFor="edit-name">
            Nome completo
          </label>
          <input
            id="edit-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="field"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="edit-phone">
              WhatsApp
            </label>
            <input
              id="edit-phone"
              value={form.phone}
              onChange={(e) => set("phone", phoneMask(e.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="edit-birth">
              Nascimento
            </label>
            <input
              id="edit-birth"
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="edit-cpf">
              CPF
            </label>
            <input
              id="edit-cpf"
              value={form.cpf}
              onChange={(e) => set("cpf", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="edit-insurance">
              Convênio
            </label>
            <input
              id="edit-insurance"
              value={form.insurance}
              onChange={(e) => set("insurance", e.target.value)}
              className="field"
              placeholder="Particular"
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="edit-email">
            E-mail
          </label>
          <input
            id="edit-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label className="label-field" htmlFor="edit-source">
            Como nos conheceu
          </label>
          <select
            id="edit-source"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className="field"
          >
            <option value="">Não informado</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field" htmlFor="edit-address">
            Endereço
          </label>
          <input
            id="edit-address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label className="label-field" htmlFor="edit-health">
            Anamnese / alertas de saúde
          </label>
          <textarea
            id="edit-health"
            value={form.healthNotes}
            onChange={(e) => set("healthNotes", e.target.value)}
            rows={3}
            className="field"
            placeholder="Alergias, medicamentos em uso, condições de saúde"
          />
          <p className="mt-1.5 text-xs text-zinc-400">
            Preenchido, aparece como alerta vermelho no topo da ficha.
          </p>
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
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export { Tag };

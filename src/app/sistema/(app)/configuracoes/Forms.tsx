"use client";

import { useActionState, useState, useTransition } from "react";
import { Tag } from "@/components/app/ui";
import { IconPlus } from "@/components/Icons";
import { createProcedure, toggleProcedure, updateClinic } from "./actions";

export function ClinicForm({
  clinic,
  disabled,
}: {
  clinic: {
    name: string;
    phone: string | null;
    address: string | null;
    cro: string | null;
    opening: string;
    closing: string;
    slot: number;
  };
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(updateClinic, {});

  return (
    <form action={action} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="name">
            Nome
          </label>
          <input id="name" name="name" defaultValue={clinic.name} disabled={disabled} className="field" />
        </div>
        <div>
          <label className="label-field" htmlFor="phone">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={clinic.phone ?? ""}
            disabled={disabled}
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="address">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          defaultValue={clinic.address ?? ""}
          disabled={disabled}
          className="field"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="cro">
            Responsável técnico (CRO)
          </label>
          <input
            id="cro"
            name="cro"
            defaultValue={clinic.cro ?? ""}
            disabled={disabled}
            className="field"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="slot">
            Intervalo da agenda
          </label>
          <select id="slot" name="slot" defaultValue={clinic.slot} disabled={disabled} className="field">
            {[15, 20, 30, 60].map((v) => (
              <option key={v} value={v}>
                {v} minutos
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="opening">
            Abre às
          </label>
          <input
            id="opening"
            type="time"
            name="opening"
            defaultValue={clinic.opening}
            disabled={disabled}
            className="field"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="closing">
            Fecha às
          </label>
          <input
            id="closing"
            type="time"
            name="closing"
            defaultValue={clinic.closing}
            disabled={disabled}
            className="field"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Alterações salvas.
        </p>
      )}

      {!disabled && (
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      )}
    </form>
  );
}

type Procedure = {
  id: string;
  name: string;
  specialty: string | null;
  durationMin: number;
  price: string;
  perTooth: boolean;
  active: boolean;
};

export function ProcedureManager({
  procedures,
  disabled,
}: {
  procedures: Procedure[];
  disabled: boolean;
}) {
  const [saving, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createProcedure({}, formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <div className="mt-5">
      {!disabled && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn btn-secondary"
        >
          <IconPlus className="h-4 w-4" />
          {open ? "Cancelar" : "Adicionar procedimento"}
        </button>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="label-field" htmlFor="procName">
              Nome
            </label>
            <input
              id="procName"
              name="name"
              required
              className="field"
              placeholder="Restauração em resina"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="specialty">
              Especialidade
            </label>
            <input id="specialty" name="specialty" className="field" placeholder="Dentística" />
          </div>
          <div>
            <label className="label-field" htmlFor="duration">
              Duração (min)
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              min={10}
              step={5}
              defaultValue={30}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="price">
              Valor (R$)
            </label>
            <input id="price" name="price" inputMode="decimal" className="field" placeholder="280,00" />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 self-end rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
            <input type="checkbox" name="perTooth" className="h-4 w-4 accent-[#2563eb]" />
            <span className="text-sm text-slate-700">Cobrado por dente</span>
          </label>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {procedures.map((p) => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
              p.active ? "" : "opacity-50"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-900">{p.name}</p>
              <p className="truncate text-xs text-slate-500">
                {[p.specialty, `${p.durationMin} min`, p.perTooth ? "por dente" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-slate-700">
              {p.price}
            </span>
            {!p.active && <Tag tone="pending">Inativo</Tag>}
            {!disabled && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  startTransition(async () => {
                    await toggleProcedure(p.id, !p.active);
                  })
                }
                className="shrink-0 cursor-pointer text-xs font-medium text-slate-400 hover:text-accent disabled:opacity-40"
              >
                {p.active ? "Desativar" : "Ativar"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

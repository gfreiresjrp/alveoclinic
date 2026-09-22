"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconSearch, IconClose } from "@/components/Icons";

const SITUATIONS = [
  { key: "", label: "Todos" },
  { key: "retorno", label: "Com retorno" },
  { key: "sem-retorno", label: "Sem retorno" },
  { key: "devendo", label: "Em aberto" },
  { key: "aniversario", label: "Aniversariantes" },
] as const;

const ORDERS = [
  { key: "nome", label: "Nome" },
  { key: "recentes", label: "Mais recentes" },
  { key: "ultima-visita", label: "Última visita" },
  { key: "devedores", label: "Maior débito" },
] as const;

export function PatientFilters({
  search,
  insurance,
  situation,
  order,
  insurances,
}: {
  search: string;
  insurance: string;
  situation: string;
  order: string;
  insurances: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(search);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    router.push(`/sistema/pacientes?${next}`);
  }

  const active = Boolean(search || insurance || situation) || order !== "nome";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: term });
        }}
        className="relative w-64"
      >
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="field field-sm field-icon"
        />
      </form>

      <div className="inline-flex items-center rounded-lg border border-zinc-200 p-0.5">
        {SITUATIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => update({ situacao: s.key })}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
              situation === s.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        aria-label="Convênio"
        value={insurance}
        onChange={(e) => update({ convenio: e.target.value })}
        className="field field-sm field-auto cursor-pointer"
      >
        <option value="">Todos os convênios</option>
        <option value="particular">Particular</option>
        {insurances.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        aria-label="Ordenar por"
        value={order}
        onChange={(e) => update({ ordem: e.target.value })}
        className="field field-sm field-auto cursor-pointer"
      >
        {ORDERS.map((o) => (
          <option key={o.key} value={o.key}>
            Ordenar: {o.label}
          </option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            update({ q: null, convenio: null, situacao: null, ordem: null });
          }}
          className="inline-flex cursor-pointer items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-700"
        >
          <IconClose className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}
    </div>
  );
}

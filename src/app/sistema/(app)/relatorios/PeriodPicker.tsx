"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { key: "mes", label: "Mês atual" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "ano", label: "Ano" },
] as const;

export function PeriodPicker({
  periodo,
  de,
  ate,
}: {
  periodo: string;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(de);
  const [to, setTo] = useState(ate);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => router.push(`/sistema/relatorios?periodo=${p.key}`)}
            className={`cursor-pointer rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
              periodo === p.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <span className="h-5 w-px bg-zinc-200" />

      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        aria-label="Data inicial"
        className="field field-sm field-auto"
      />
      <span className="text-sm text-zinc-400">até</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        aria-label="Data final"
        className="field field-sm field-auto"
      />
      <button
        type="button"
        onClick={() =>
          router.push(`/sistema/relatorios?periodo=custom&de=${from}&ate=${to}`)
        }
        className="btn btn-secondary py-1.5 text-[13px]"
      >
        Aplicar
      </button>
    </div>
  );
}

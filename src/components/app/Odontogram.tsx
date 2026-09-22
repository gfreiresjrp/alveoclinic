"use client";

import { useState, useTransition } from "react";
import { setToothCondition } from "@/app/sistema/(app)/pacientes/actions";
import { FaceWheel, ToothGlyph } from "./ToothGlyph";

/**
 * Odontograma em notação FDI, com as duas dentições.
 *
 * Cada dente aparece como silhueta (estado geral) e como roda de faces
 * (vestibular, distal, lingual, mesial e oclusal). Clicar na silhueta marca o
 * dente inteiro; clicar numa fatia marca só aquela face.
 */

export type ToothRecord = {
  tooth: number;
  face: string | null;
  condition: string;
};

export const CONDITIONS: Record<string, { label: string; color: string }> = {
  healthy: { label: "Hígido", color: "transparent" },
  caries: { label: "Cárie", color: "#e11d48" },
  restored: { label: "Restaurado", color: "#2563eb" },
  root_canal: { label: "Canal tratado", color: "#7c3aed" },
  crown: { label: "Coroa", color: "#d97706" },
  implant: { label: "Implante", color: "#059669" },
  fracture: { label: "Fratura", color: "#ea580c" },
  extracted: { label: "Extraído", color: "#64748b" },
  absent: { label: "Ausente", color: "#cbd5e1" },
};

/** Condições que valem para o dente todo, não para uma face. */
const WHOLE_TOOTH = new Set(["extracted", "absent", "implant", "crown", "root_canal", "fracture"]);
const MISSING = new Set(["extracted", "absent"]);

const PERMANENT = {
  upper: [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]],
  lower: [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]],
};

const DECIDUOUS = {
  upper: [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65]],
  lower: [[85, 84, 83, 82, 81], [71, 72, 73, 74, 75]],
};

export function Odontogram({
  patientId,
  records,
  readOnly = false,
}: {
  patientId: string;
  records: ToothRecord[];
  readOnly?: boolean;
}) {
  const [dentition, setDentition] = useState<"permanent" | "deciduous">("permanent");
  const [selected, setSelected] = useState<{ tooth: number; face: string | null } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = dentition === "permanent" ? PERMANENT : DECIDUOUS;

  const byTooth = new Map<number, ToothRecord[]>();
  for (const r of records) {
    const list = byTooth.get(r.tooth) ?? [];
    list.push(r);
    byTooth.set(r.tooth, list);
  }

  function apply(condition: string) {
    if (!selected) return;
    startTransition(async () => {
      await setToothCondition(patientId, selected.tooth, selected.face, condition);
      setSelected(null);
    });
  }

  function renderArch(rows: number[][], upper: boolean) {
    return (
      <div className="flex items-stretch justify-center gap-5">
        {rows.map((row, side) => (
          <div key={side} className="flex flex-1 gap-1">
            {row.map((tooth) => {
              const list = byTooth.get(tooth) ?? [];
              const whole = list.find((r) => !r.face);
              const wholeColor = whole ? CONDITIONS[whole.condition]?.color : null;
              const missing = whole ? MISSING.has(whole.condition) : false;
              const isSelected = selected?.tooth === tooth;

              const faceColor = (face: string) => {
                const record = list.find((r) => r.face === face);
                return record ? CONDITIONS[record.condition]?.color ?? null : null;
              };

              const glyph = (
                <ToothGlyph
                  tooth={tooth}
                  upper={upper}
                  fill={whole && WHOLE_TOOTH.has(whole.condition) ? wholeColor : null}
                  crossed={missing}
                  faded={missing}
                  interactive={!readOnly}
                  onClick={readOnly ? undefined : () => setSelected({ tooth, face: null })}
                />
              );

              const wheel = (
                <FaceWheel
                  upper={upper}
                  colorOf={faceColor}
                  faded={missing}
                  interactive={!readOnly && !missing}
                  onPick={(face) => setSelected({ tooth, face })}
                />
              );

              const number = (
                <p
                  className={`text-center text-xs tabular-nums ${
                    isSelected ? "font-semibold text-accent" : "text-zinc-500"
                  }`}
                >
                  {tooth}
                </p>
              );

              return (
                <div
                  key={tooth}
                  className={`min-w-0 flex-1 rounded-md px-0.5 py-1 transition-colors ${
                    isSelected ? "bg-accent-soft" : ""
                  }`}
                >
                  {upper ? (
                    <>
                      {glyph}
                      <div className="mt-1 px-1">{wheel}</div>
                      <div className="mt-1">{number}</div>
                    </>
                  ) : (
                    <>
                      <div className="mb-1">{number}</div>
                      <div className="mb-1 px-1">{wheel}</div>
                      {glyph}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {(["permanent", "deciduous"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDentition(key);
                setSelected(null);
              }}
              className={`cursor-pointer rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                dentition === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {key === "permanent" ? "Permanentes" : "Decíduos"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(CONDITIONS)
            .filter(([key]) => key !== "healthy")
            .map(([key, { label, color }]) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="mx-auto min-w-[720px] max-w-4xl">
          {renderArch(set.upper, true)}
          <div className="my-3 border-t border-dashed border-zinc-200" />
          {renderArch(set.lower, false)}
        </div>
      </div>

      {selected && !readOnly && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-700">
              Dente <strong className="font-semibold text-accent">{selected.tooth}</strong>
              {selected.face ? ` · face ${selected.face}` : " · dente inteiro"}
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(CONDITIONS).map(([key, { label, color }]) => (
              <button
                key={key}
                type="button"
                disabled={pending}
                onClick={() => apply(key)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-zinc-300"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

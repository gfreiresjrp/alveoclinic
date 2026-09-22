"use client";

import { useState, useTransition } from "react";
import { CardTitle } from "@/components/app/ui";
import { IconPlus, IconCheck } from "@/components/Icons";
import { shortDate } from "@/lib/format";
import { addReminder, toggleReminder } from "../actions";

type Reminder = {
  id: string;
  dueDate: string;
  note: string;
  done: boolean;
};

/** Lembretes do paciente: "ligar dia 15, o cartão dele vira". */
export function Reminders({
  patientId,
  reminders,
  today,
}: {
  patientId: string;
  reminders: Reminder[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await addReminder(patientId, dueDate, note);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setNote("");
      setError("");
      setOpen(false);
    });
  }

  return (
    <div className="panel p-5">
      <CardTitle
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <IconPlus className="h-3.5 w-3.5" />
            {open ? "Cancelar" : "Novo"}
          </button>
        }
      >
        Lembretes
      </CardTitle>

      {open && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field field-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ligar — o cartão dele vira dia 15"
            className="field field-sm"
          />
          {error && <p className="text-xs text-rose-700">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="btn btn-primary w-full py-1.5 text-[13px]"
          >
            {pending ? "Salvando…" : "Criar lembrete"}
          </button>
        </div>
      )}

      {reminders.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Nenhum lembrete.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {reminders.map((r) => {
            const vencido = !r.done && r.dueDate <= today;
            return (
              <li
                key={r.id}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
                  r.done
                    ? "border-zinc-100 bg-zinc-50 opacity-60"
                    : vencido
                      ? "border-amber-200 bg-amber-50"
                      : "border-zinc-200"
                }`}
              >
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleReminder(r.id, !r.done);
                    })
                  }
                  aria-label={r.done ? "Reabrir lembrete" : "Marcar como feito"}
                  className={`mt-0.5 grid h-4 w-4 shrink-0 cursor-pointer place-items-center rounded border transition-colors ${
                    r.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 hover:border-emerald-500"
                  }`}
                >
                  {r.done && <IconCheck className="h-2.5 w-2.5" />}
                </button>

                <div className="min-w-0">
                  <p className={`text-sm ${r.done ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                    {r.note}
                  </p>
                  <p className={`text-xs ${vencido ? "text-amber-700" : "text-zinc-400"}`}>
                    {vencido ? "venceu em " : ""}
                    {shortDate(r.dueDate)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

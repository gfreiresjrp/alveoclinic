"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/app/ui";
import { IconPlus } from "@/components/Icons";
import { phoneMask } from "@/lib/format";
import { createPatient } from "./actions";
import { SOURCES } from "./[id]/PatientHeader";

export function NewPatientButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Em caso de sucesso a própria action redireciona para a ficha criada; em
  // caso de erro, onSubmit mantém o formulário preenchido.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createPatient({}, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <IconPlus className="h-4 w-4" />
        Novo paciente
      </button>

      {open && (
        <Dialog title="Novo paciente" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="label-field" htmlFor="name">
                Nome completo
              </label>
              <input id="name" name="name" required className="field" placeholder="Maria da Silva" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field" htmlFor="phone">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(phoneMask(e.target.value))}
                  className="field"
                  placeholder="(11) 90000-0000"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="birthDate">
                  Nascimento
                </label>
                <input id="birthDate" type="date" name="birthDate" className="field" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field" htmlFor="cpf">
                  CPF
                </label>
                <input id="cpf" name="cpf" className="field" placeholder="Opcional" />
              </div>
              <div>
                <label className="label-field" htmlFor="insurance">
                  Convênio
                </label>
                <input id="insurance" name="insurance" className="field" placeholder="Particular" />
              </div>
            </div>

            <div>
              <label className="label-field" htmlFor="email">
                E-mail
              </label>
              <input id="email" type="email" name="email" className="field" placeholder="Opcional" />
            </div>

            <div>
              <label className="label-field" htmlFor="source">
                Como nos conheceu
              </label>
              <select id="source" name="source" defaultValue="" className="field">
                <option value="">Não informado</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field" htmlFor="healthNotes">
                Anamnese resumida
              </label>
              <textarea
                id="healthNotes"
                name="healthNotes"
                rows={3}
                className="field"
                placeholder="Alergias, medicamentos em uso, condições de saúde"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? "Salvando…" : "Cadastrar"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Tag, Dialog, APPOINTMENT_STATUS, SOURCE_LABEL } from "@/components/app/ui";
import { IconArrowRight } from "@/components/Icons";
import { hhmm, longDate } from "@/lib/format";
import { createAppointment, setAppointmentStatus } from "./actions";
import type { Appointment, Option } from "./types";

export function NewAppointmentDialog({
  initial,
  onClose,
  dentists,
  procedures,
  chairs,
  patients,
}: {
  initial: { date: string; time: string; dentistId?: string };
  onClose: () => void;
  dentists: Option[];
  procedures: (Option & { durationMin: number })[];
  chairs: Option[];
  patients: Option[];
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // onSubmit em vez de `action`: o diálogo só fecha depois do sucesso e, em
  // caso de erro, o formulário mantém o que já foi preenchido.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAppointment({}, formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Dialog title="Novo agendamento" onClose={onClose}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="label-field" htmlFor="patientId">
            Paciente
          </label>
          <select id="patientId" name="patientId" required defaultValue="" className="field">
            <option value="" disabled>
              Selecione
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="dentistId">
              Dentista
            </label>
            <select
              id="dentistId"
              name="dentistId"
              required
              defaultValue={initial.dentistId ?? dentists[0]?.id}
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
            <label className="label-field" htmlFor="chairId">
              Consultório
            </label>
            <select id="chairId" name="chairId" defaultValue={chairs[0]?.id ?? ""} className="field">
              <option value="">Sem definir</option>
              {chairs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="procedureId">
            Procedimento
          </label>
          <select id="procedureId" name="procedureId" defaultValue="" className="field">
            <option value="">Consulta (30 min)</option>
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.durationMin} min
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="date">
              Data
            </label>
            <input
              id="date"
              type="date"
              name="date"
              required
              defaultValue={initial.date}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="time">
              Horário
            </label>
            <input
              id="time"
              type="time"
              name="time"
              required
              defaultValue={initial.time}
              step={300}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="reason">
            Motivo da consulta
          </label>
          <input
            id="reason"
            name="reason"
            className="field"
            placeholder="Dor no dente 26, avaliação de aparelho…"
          />
        </div>

        <div>
          <label className="label-field" htmlFor="notes">
            Observação
          </label>
          <textarea id="notes" name="notes" rows={2} className="field" placeholder="Opcional" />
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
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Salvando…" : "Agendar"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const STATUS_ACTIONS = [
  ["confirmed", "Confirmar"],
  ["arrived", "Chegou na clínica"],
  ["attended", "Marcar atendido"],
  ["noshow", "Registrar falta"],
  ["rescheduled", "Remarcou"],
  ["canceled", "Cancelar"],
] as const;

/** Status que só podem ser gravados com uma justificativa escrita. */
const NEEDS_NOTE = new Set(["noshow", "rescheduled", "canceled"]);

export function AppointmentDetail({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function change(status: string, justification?: string) {
    setSaving(status);
    const result = await setAppointmentStatus(appointment.id, status, justification);
    setSaving("");
    if (result?.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  function pick(status: string) {
    setError("");
    // Falta, remarcação e cancelamento pedem o porquê antes de gravar.
    if (NEEDS_NOTE.has(status)) {
      setAsking(status);
      setNote("");
      return;
    }
    void change(status);
  }

  return (
    <Dialog title={appointment.patientName} onClose={onClose}>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tag tone={appointment.status}>{APPOINTMENT_STATUS[appointment.status]}</Tag>
        <Tag tone={appointment.source === "ai" ? "ai" : "scheduled"}>
          Marcado por {SOURCE_LABEL[appointment.source]}
        </Tag>
      </div>

      <dl className="mt-5 space-y-0 text-sm">
        <Row
          label="Quando"
          value={`${longDate(appointment.date)} · ${hhmm(appointment.startMin)}–${hhmm(appointment.endMin)}`}
        />
        <Row label="Procedimento" value={appointment.procedureName ?? "Consulta"} />
        <Row label="Dentista" value={appointment.dentistName} />
        <Row label="Consultório" value={appointment.chairName ?? "—"} />
        {appointment.reason && <Row label="Motivo" value={appointment.reason} />}
        {appointment.notes && <Row label="Observação" value={appointment.notes} />}
        {appointment.statusNote && (
          <Row label="Justificativa" value={appointment.statusNote} />
        )}
      </dl>

      <Link
        href={`/sistema/pacientes/${appointment.patientId}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        Abrir ficha do paciente
        <IconArrowRight className="h-4 w-4" />
      </Link>

      {asking ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <label className="label-field" htmlFor="status-note">
            Por quê?
          </label>
          <input
            id="status-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
            className="field"
            placeholder={
              asking === "noshow"
                ? "Não avisou, avisou em cima da hora…"
                : asking === "rescheduled"
                  ? "Pediu para mudar para a semana que vem…"
                  : "Paciente cancelou, clínica cancelou…"
            }
          />

          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAsking(null)}
              className="btn btn-secondary"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={saving !== ""}
              onClick={() => change(asking, note)}
              className="btn btn-primary"
            >
              {saving ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {STATUS_ACTIONS.map(([status, text]) => (
              <button
                key={status}
                type="button"
                disabled={saving !== "" || appointment.status === status}
                onClick={() => pick(status)}
                className={`btn ${status === "canceled" ? "btn-danger" : "btn-secondary"}`}
              >
                {saving === status ? "…" : text}
              </button>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-zinc-100 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

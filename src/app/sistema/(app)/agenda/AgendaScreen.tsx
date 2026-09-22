"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APPOINTMENT_STATUS } from "@/components/app/ui";
import { IconPlus, IconSearch, IconClose } from "@/components/Icons";
import {
  addDays,
  addMonths,
  hhmm,
  longDate,
  monthTitle,
  shortDate,
  weekdayOf,
} from "@/lib/format";
import { MiniCalendar } from "./MiniCalendar";
import { TimeGrid } from "./TimeGrid";
import { MonthView } from "./MonthView";
import { NewAppointmentDialog, AppointmentDetail } from "./AppointmentDialogs";
import type { Appointment, Column, Dentist, Option } from "./types";

type View = "dia" | "semana" | "mes";

const VIEWS: { key: View; label: string; shortcut: string }[] = [
  { key: "dia", label: "Dia", shortcut: "D" },
  { key: "semana", label: "Semana", shortcut: "S" },
  { key: "mes", label: "Mês", shortcut: "M" },
];

export function AgendaScreen({
  view,
  weekStart,
  day,
  today,
  total,
  appointments,
  dentists,
  selectedDentists,
  hiddenDays,
  chairFilter,
  statusFilter,
  search,
  procedures,
  chairs,
  patients,
  hours,
}: {
  view: View;
  weekStart: string;
  day: string;
  today: string;
  total: number;
  appointments: Appointment[];
  dentists: Dentist[];
  selectedDentists: string[];
  hiddenDays: string[];
  chairFilter: string;
  statusFilter: string;
  search: string;
  procedures: (Option & { durationMin: number })[];
  chairs: Option[];
  patients: Option[];
  hours: { from: number; to: number; slot: number };
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [dialog, setDialog] = useState<{ date: string; time: string; dentistId?: string } | null>(
    null,
  );
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [term, setTerm] = useState(search);
  const [sidebar, setSidebar] = useState(true);

  /** Todo filtro vive na URL: o link pode ser salvo e compartilhado. */
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    router.push(`/sistema/agenda?${next}`);
  }

  function goTo(date: string) {
    update({ semana: date, dia: date });
  }

  function step(direction: number) {
    if (view === "mes") goTo(addMonths(day, direction));
    else if (view === "semana") goTo(addDays(weekStart, direction * 7));
    else goTo(addDays(day, direction));
  }

  function setView(next: View) {
    update({ vista: next === "semana" ? null : next });
  }

  // Atalhos no espírito do Google Agenda.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "t") goTo(today);
      else if (key === "d") setView("dia");
      else if (key === "s") setView("semana");
      else if (key === "m") setView("mes");
      else if (key === "arrowleft" || key === "k") step(-1);
      else if (key === "arrowright" || key === "j") step(1);
      else return;

      event.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const hiddenWeekdays: number[] = hiddenDays.map((d) => (d === "sab" ? 6 : 0));

  function toggleDay(key: "sab" | "dom") {
    const next = hiddenDays.includes(key)
      ? hiddenDays.filter((d) => d !== key)
      : [...hiddenDays, key];
    update({ ocultar: next.join(",") });
  }

  const visibleDentists =
    selectedDentists.length > 0
      ? dentists.filter((d) => selectedDentists.includes(d.id))
      : dentists;

  const columns: Column[] =
    view === "semana"
      ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
          .filter((date) => !hiddenWeekdays.includes(weekdayOf(date)))
          .map((date) => ({ key: date, date, title: shortDate(date) }))
      : visibleDentists.map((d) => ({ key: d.id, date: day, title: d.name, dentistId: d.id }));

  const title =
    view === "mes"
      ? monthTitle(day)
      : view === "dia"
        ? longDate(day)
        : monthTitle(weekStart);

  const filtersOn =
    selectedDentists.length > 0 ||
    hiddenDays.length > 0 ||
    Boolean(chairFilter) ||
    Boolean(statusFilter) ||
    Boolean(search);

  return (
    <div className="flex h-[calc(100svh-var(--app-header))] bg-white">
      {/* ---------- barra lateral ---------- */}
      {sidebar && (
        <aside className="hidden w-[216px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-zinc-200 px-3 py-5 lg:flex">
          <button
            type="button"
            onClick={() => setDialog({ date: day, time: hhmm(hours.from) })}
            className="inline-flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 text-[13px] font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            <IconPlus className="h-4 w-4" />
            Criar
          </button>

          <MiniCalendar selected={day} today={today} onPick={goTo} />

          <div>
            <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Dentistas
            </p>
            <div className="mt-2.5 space-y-1">
              {dentists.map((d) => {
                const checked = selectedDentists.length === 0 || selectedDentists.includes(d.id);
                return (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        // Nenhum marcado significa "todos"; o primeiro clique
                        // isola o dentista em vez de esvaziar a agenda.
                        const base =
                          selectedDentists.length === 0 ? dentists.map((x) => x.id) : selectedDentists;
                        const next = base.includes(d.id)
                          ? base.filter((id) => id !== d.id)
                          : [...base, d.id];
                        update({
                          dentistas: next.length === dentists.length ? null : next.join(","),
                        });
                      }}
                      className="h-3.5 w-3.5 cursor-pointer rounded-[3px]"
                      style={{ accentColor: d.color }}
                    />
                    <span className="truncate text-[13px] text-zinc-600">{d.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Dias
            </p>
            <div className="mt-2.5 space-y-1">
              {([
                ["sab", "Sábado"],
                ["dom", "Domingo"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenDays.includes(key)}
                    onChange={() => toggleDay(key)}
                    className="h-3.5 w-3.5 cursor-pointer rounded-[3px]"
                    style={{ accentColor: "#2563eb" }}
                  />
                  <span className="truncate text-[13px] text-zinc-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Filtros
            </p>

            <div className="mt-2.5 space-y-2.5">
              <select
                aria-label="Consultório"
                value={chairFilter}
                onChange={(e) => update({ cadeira: e.target.value })}
                className="field field-sm cursor-pointer"
              >
                <option value="">Todos os consultórios</option>
                {chairs.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Status"
                value={statusFilter}
                onChange={(e) => update({ status: e.target.value })}
                className="field field-sm cursor-pointer"
              >
                <option value="">Todos os status</option>
                {Object.entries(APPOINTMENT_STATUS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  update({ q: term });
                }}
                className="relative"
              >
                <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  aria-label="Buscar paciente"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Paciente"
                  className="field field-sm field-icon"
                />
              </form>

              {filtersOn && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm("");
                    update({ dentistas: null, cadeira: null, status: null, q: null, ocultar: null });
                  }}
                  className="mt-1 inline-flex cursor-pointer items-center gap-1 px-1 text-[12px] text-zinc-400 hover:text-zinc-700"
                >
                  <IconClose className="h-3 w-3" />
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ---------- área principal ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-200 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSidebar((v) => !v)}
            aria-label={sidebar ? "Esconder painel" : "Mostrar painel"}
            className="hidden cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:block"
          >
            <span className="block h-[2px] w-4 bg-current" />
            <span className="mt-1 block h-[2px] w-4 bg-current" />
            <span className="mt-1 block h-[2px] w-4 bg-current" />
          </button>

          <button
            type="button"
            onClick={() => goTo(today)}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Hoje
          </button>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Anterior"
              className="cursor-pointer rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próximo"
              className="cursor-pointer rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100"
            >
              ›
            </button>
          </div>

          <h1 className="font-display truncate text-lg font-medium text-zinc-800">{title}</h1>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[13px] text-zinc-400 sm:inline">
              {appointments.length}
              {filtersOn && appointments.length !== total ? ` de ${total}` : ""}{" "}
              {appointments.length === 1 ? "atendimento" : "atendimentos"}
            </span>

            <div className="inline-flex items-center rounded-lg border border-zinc-200 p-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  title={`${v.label} (${v.shortcut})`}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                    view === v.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDialog({ date: day, time: hhmm(hours.from) })}
              className="btn btn-primary lg:hidden"
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {view === "mes" ? (
            <MonthView
              anchor={day}
              today={today}
              hiddenWeekdays={hiddenWeekdays}
              appointments={appointments}
              onPickDay={(date) => update({ vista: "dia", dia: date, semana: date })}
              onPickAppointment={setDetail}
            />
          ) : (
            <TimeGrid
              columns={columns}
              appointments={appointments}
              today={today}
              hours={hours}
              showDayHeader={view === "semana"}
              onPickSlot={(date, time, dentistId) => setDialog({ date, time, dentistId })}
              onPickAppointment={setDetail}
            />
          )}
        </div>
      </div>

      {dialog && (
        <NewAppointmentDialog
          initial={dialog}
          onClose={() => setDialog(null)}
          dentists={dentists}
          procedures={procedures}
          chairs={chairs}
          patients={patients}
        />
      )}

      {detail && <AppointmentDetail appointment={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

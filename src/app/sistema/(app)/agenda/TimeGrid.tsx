"use client";

import { useEffect, useRef, useState } from "react";
import { APPOINTMENT_ACCENT } from "@/components/app/ui";
import { dayNumber, hhmm, minutesNow, weekdayShort } from "@/lib/format";
import type { Appointment, Column } from "./types";

const HOUR_HEIGHT = 56;
const pxFor = (minutes: number) => (minutes * HOUR_HEIGHT) / 60;

/**
 * Mistura a cor do dentista com branco e devolve uma cor OPACA.
 * Fundo com transparência deixaria as linhas de hora aparecerem por baixo
 * do agendamento.
 */
function tint(hex: string, amount: number) {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;

  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  if (channels.some(Number.isNaN)) return "#f4f4f5";

  const mixed = channels.map((c) => Math.round(c * amount + 255 * (1 - amount)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Coloca eventos que se sobrepõem lado a lado, como o Google Agenda: quem
 * divide o mesmo intervalo divide também a largura da coluna.
 */
function layout(items: Appointment[]) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const placed: (Appointment & { lane: number; lanes: number })[] = [];

  let cluster: typeof placed = [];
  let clusterEnd = -1;

  function flush() {
    const lanes = cluster.reduce((max, item) => Math.max(max, item.lane + 1), 0);
    for (const item of cluster) item.lanes = lanes;
    placed.push(...cluster);
    cluster = [];
    clusterEnd = -1;
  }

  for (const item of sorted) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flush();

    // Primeira faixa livre dentro do grupo que está sendo montado.
    const taken = new Set(
      cluster.filter((c) => c.endMin > item.startMin).map((c) => c.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane += 1;

    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();

  return placed;
}

const DAY_START = 0;
const DAY_END = 24 * 60;

export function TimeGrid({
  columns,
  appointments,
  today,
  hours,
  showDayHeader,
  onPickSlot,
  onPickAppointment,
}: {
  columns: Column[];
  appointments: Appointment[];
  today: string;
  /** Horário de funcionamento — usado só para sombrear o fora de expediente. */
  hours: { from: number; to: number; slot: number };
  showDayHeader: boolean;
  onPickSlot: (date: string, time: string, dentistId?: string) => void;
  onPickAppointment: (appointment: Appointment) => void;
}) {
  const [now, setNow] = useState(() => minutesNow());
  const rootRef = useRef<HTMLDivElement>(null);

  // A linha vermelha do horário atual anda sozinha.
  useEffect(() => {
    const timer = setInterval(() => setNow(minutesNow()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const hourMarks: number[] = [];
  for (let m = DAY_START; m <= DAY_END; m += 60) hourMarks.push(m);

  const bodyHeight = pxFor(DAY_END - DAY_START);

  // O dia inteiro está na tela, mas a rolagem começa no expediente: ninguém
  // quer abrir a agenda olhando para as três da manhã.
  useEffect(() => {
    const scroller = rootRef.current?.parentElement;
    if (!scroller) return;
    scroller.scrollTop = Math.max(pxFor(hours.from) - 24, 0);
  }, [hours.from]);

  /** Converte o clique num horário arredondado para o intervalo da agenda. */
  function slotFromClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = ((event.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const rounded = Math.floor(minutes / hours.slot) * hours.slot;
    return hhmm(Math.min(Math.max(rounded, DAY_START), DAY_END - hours.slot));
  }

  return (
    <div ref={rootRef} className="flex min-h-full min-w-[860px] flex-col">
      {/* cabeçalho das colunas */}
      <div
        className="sticky top-0 z-20 grid border-b border-zinc-200 bg-white"
        style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        <div className="flex items-end justify-end pb-1.5 pr-2">
          <span className="text-[10px] text-zinc-400">GMT−3</span>
        </div>

        {columns.map((col) => {
          const isToday = showDayHeader && col.date === today;
          return (
            <div key={col.key} className="border-l border-zinc-200 px-2 py-2 text-center">
              {showDayHeader ? (
                <>
                  <p
                    className={`text-[11px] uppercase tracking-wide ${
                      isToday ? "text-accent" : "text-zinc-400"
                    }`}
                  >
                    {weekdayShort(col.date)}
                  </p>
                  <p
                    className={`font-display mx-auto mt-0.5 grid h-8 w-8 place-items-center rounded-full text-base font-medium ${
                      isToday ? "bg-accent text-white" : "text-zinc-700"
                    }`}
                  >
                    {dayNumber(col.date)}
                  </p>
                </>
              ) : (
                <p className="truncate py-2 text-sm font-medium text-zinc-700">{col.title}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* corpo */}
      <div
        className="relative grid flex-1"
        style={{
          gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))`,
          minHeight: bodyHeight,
        }}
      >
        {/* coluna de horas */}
        <div className="relative">
          {hourMarks.map((mark) => (
            <span
              key={mark}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-zinc-400"
              style={{ top: pxFor(mark) }}
            >
              {mark > DAY_START && mark < DAY_END ? hhmm(mark) : ""}
            </span>
          ))}
        </div>

        {columns.map((col) => {
          const items = layout(
            appointments.filter(
              (a) =>
                a.date === col.date && (!col.dentistId || a.dentistId === col.dentistId),
            ),
          );

          return (
            <div
              key={col.key}
              onClick={(event) => onPickSlot(col.date, slotFromClick(event), col.dentistId)}
              role="presentation"
              className="relative border-l border-zinc-200"
            >
              {/* linhas de hora */}
              {hourMarks.slice(1, -1).map((mark) => (
                <span
                  key={mark}
                  className="absolute inset-x-0 border-t border-zinc-100"
                  style={{ top: pxFor(mark) }}
                />
              ))}

              {/* linha do agora */}
              {col.date === today && (
                <span
                  className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                  style={{ top: pxFor(now) }}
                >
                  <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-rose-600" />
                  <span className="h-px flex-1 bg-rose-600" />
                </span>
              )}

              {items.map((a) => {
                const top = pxFor(a.startMin);
                const height = Math.max(pxFor(a.endMin - a.startMin) - 2, 20);
                const canceled = a.status === "canceled";
                // Chegou, atendeu, faltou: o status manda na cor. Fora isso,
                // vale a cor do dentista.
                const accent = APPOINTMENT_ACCENT[a.status] ?? a.dentistColor;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPickAppointment(a);
                    }}
                    title={[
                      a.patientName,
                      `${hhmm(a.startMin)}–${hhmm(a.endMin)}`,
                      a.dentistName,
                      a.reason,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    className={`absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left transition-shadow hover:shadow-md ${
                      canceled ? "opacity-50 line-through" : ""
                    }`}
                    style={{
                      top,
                      height,
                      left: `calc(${(a.lane / a.lanes) * 100}% + 2px)`,
                      width: `calc(${100 / a.lanes}% - 4px)`,
                      borderLeftColor: accent,
                      backgroundColor: tint(accent, 0.16),
                    }}
                  >
                    <p className="truncate text-[11px] font-semibold leading-tight text-zinc-900">
                      {hhmm(a.startMin)} {a.patientName}
                    </p>
                    {height > 34 && (
                      <p className="truncate text-[10px] leading-tight text-zinc-500">
                        {a.procedureName ?? "Consulta"}
                      </p>
                    )}
                    {height > 52 && (
                      <p className="truncate text-[10px] leading-tight text-zinc-400">
                        {a.dentistName}
                      </p>
                    )}
                  </button>
                );
              })}

              {/* marca o dia inteiro quando é hoje, na visão de semana */}
              {showDayHeader && col.date === today && (
                <span className="pointer-events-none absolute inset-0 -z-10 bg-accent-soft/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

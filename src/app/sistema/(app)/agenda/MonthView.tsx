"use client";

import { dayNumber, hhmm, monthMatrix, sameMonth, weekdayOf, weekdayShort } from "@/lib/format";
import type { Appointment } from "./types";

const MAX_VISIBLE = 3;

export function MonthView({
  anchor,
  today,
  hiddenWeekdays,
  appointments,
  onPickDay,
  onPickAppointment,
}: {
  anchor: string;
  today: string;
  hiddenWeekdays: number[];
  appointments: Appointment[];
  onPickDay: (date: string) => void;
  onPickAppointment: (appointment: Appointment) => void;
}) {
  const weeks = monthMatrix(anchor).map((week) =>
    week.filter((date) => !hiddenWeekdays.includes(weekdayOf(date))),
  );
  const columns = weeks[0].length;

  const byDay = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const list = byDay.get(a.date) ?? [];
    list.push(a);
    byDay.set(a.date, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.startMin - b.startMin);

  return (
    <div className="flex min-h-full min-w-[760px] flex-col">
      <div
        className="sticky top-0 z-20 grid border-b border-zinc-200 bg-white"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {weeks[0].map((date) => (
          <span
            key={date}
            className="border-l border-zinc-200 py-2 text-center text-[11px] uppercase tracking-wide text-zinc-400 first:border-l-0"
          >
            {weekdayShort(date)}
          </span>
        ))}
      </div>

      <div className="grid flex-1 grid-rows-6">
        {weeks.map((week, i) => (
          <div
            key={i}
            className="grid border-b border-zinc-100 last:border-b-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {week.map((date) => {
              const items = byDay.get(date) ?? [];
              const isToday = date === today;
              const outside = !sameMonth(date, anchor);

              return (
                <div
                  key={date}
                  onClick={() => onPickDay(date)}
                  role="presentation"
                  className={`min-h-[96px] cursor-pointer border-l border-zinc-100 p-1.5 transition-colors first:border-l-0 hover:bg-zinc-50 ${
                    outside ? "bg-zinc-50/60" : ""
                  }`}
                >
                  <p
                    className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                      isToday
                        ? "bg-accent font-semibold text-white"
                        : outside
                          ? "text-zinc-300"
                          : "text-zinc-600"
                    }`}
                  >
                    {dayNumber(date)}
                  </p>

                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, MAX_VISIBLE).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPickAppointment(a);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] hover:bg-zinc-100 ${
                          a.status === "canceled" ? "opacity-50 line-through" : ""
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: a.dentistColor }}
                        />
                        <span className="shrink-0 text-zinc-400">{hhmm(a.startMin)}</span>
                        <span className="truncate text-zinc-700">{a.patientName}</span>
                      </button>
                    ))}

                    {items.length > MAX_VISIBLE && (
                      <p className="px-1 text-[10px] font-medium text-zinc-400">
                        mais {items.length - MAX_VISIBLE}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { addMonths, dayNumber, isoDate, monthTitle, monthMatrix, sameMonth } from "@/lib/format";
import { useState } from "react";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

/** Calendário compacto da barra lateral, para pular de data. */
export function MiniCalendar({
  selected,
  today,
  onPick,
}: {
  selected: string;
  today: string;
  onPick: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(selected);
  const weeks = monthMatrix(cursor);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-zinc-600">{monthTitle(cursor)}</p>
        <div className="flex">
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            aria-label="Mês anterior"
            className="cursor-pointer rounded px-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Próximo mês"
            className="cursor-pointer rounded px-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-0.5 text-center text-[10px] font-medium text-zinc-300">
            {d}
          </span>
        ))}

        {weeks.flat().map((date) => {
          const isSelected = date === selected;
          const isToday = date === today;
          const outside = !sameMonth(date, cursor);

          return (
            <button
              key={date}
              type="button"
              onClick={() => onPick(date)}
              className={`mx-auto grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full text-[11px] transition-colors ${
                isSelected
                  ? "bg-accent font-semibold text-white"
                  : isToday
                    ? "font-semibold text-accent hover:bg-zinc-100"
                    : outside
                      ? "text-zinc-300 hover:bg-zinc-100"
                      : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {dayNumber(date)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          setCursor(isoDate(new Date()));
          onPick(today);
        }}
        className="mt-2 w-full cursor-pointer rounded-md py-1 text-[11px] text-zinc-300 hover:bg-zinc-100 hover:text-zinc-700"
      >
        Ir para hoje
      </button>
    </div>
  );
}

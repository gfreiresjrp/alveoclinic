"use client";

import { useState } from "react";
import { dayNumber, shortDate } from "@/lib/format";

/**
 * Atendimentos por dia no mês. Série única — o título já diz o que é, então
 * não leva legenda; os valores aparecem no toque/hover e no resumo abaixo.
 */
export function DailyBars({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.count), 1);
  const busiest = data.reduce((a, b) => (b.count > a.count ? b : a), data[0]);

  return (
    <div>
      <div className="relative">
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            {shortDate(data[hover].date)} ·{" "}
            {data[hover].count === 1 ? "1 atendimento" : `${data[hover].count} atendimentos`}
          </div>
        )}

        <div className="flex h-28 items-end gap-[2px] border-b border-zinc-200">
          {data.map((day, i) => (
            <button
              key={day.date}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${shortDate(day.date)}: ${day.count} atendimentos`}
              className="group flex h-full flex-1 cursor-default items-end"
            >
              <span
                className="w-full rounded-t-[4px] transition-colors"
                style={{
                  height: `${Math.max((day.count / max) * 100, day.count > 0 ? 6 : 1.5)}%`,
                  backgroundColor:
                    day.count === 0
                      ? "var(--chart-empty)"
                      : hover === i
                        ? "#1d4ed8"
                        : "#2563eb",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-400">
        {data
          .filter((_, i) => i % 7 === 0)
          .map((day) => (
            <span key={day.date}>{dayNumber(day.date)}</span>
          ))}
        <span>{dayNumber(data.at(-1)!.date)}</span>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Dia mais cheio: <strong className="font-medium text-zinc-700">
          {shortDate(busiest.date)}
        </strong>{" "}
        com {busiest.count} {busiest.count === 1 ? "atendimento" : "atendimentos"}.
      </p>
    </div>
  );
}

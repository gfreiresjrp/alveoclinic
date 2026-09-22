"use client";

import Link from "next/link";
import { useState } from "react";
import type { Notification, NotificationTone } from "@/lib/notifications";
import { Card, EmptyState, PageHeader, Tag } from "@/components/app/ui";
import { IconArrowRight, IconBell } from "@/components/Icons";

const TOM: Record<NotificationTone, { tag: string; dot: string }> = {
  urgente: { tag: "overdue", dot: "bg-rose-500" },
  atencao: { tag: "due", dot: "bg-amber-500" },
  info: { tag: "scheduled", dot: "bg-sky-500" },
};

export function NotificationBoard({ items }: { items: Notification[] }) {
  const [grupo, setGrupo] = useState<string>("todos");

  const grupos = [...new Set(items.map((i) => i.group))];
  const visiveis = grupo === "todos" ? items : items.filter((i) => i.group === grupo);

  const urgentes = items.filter((i) => i.tone === "urgente").length;
  const atencao = items.filter((i) => i.tone === "atencao").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notificações"
        subtitle={
          items.length === 0
            ? "Nada pendente na clínica"
            : `${items.length} ${items.length === 1 ? "aviso" : "avisos"}${
                urgentes > 0 ? ` · ${urgentes} urgente${urgentes > 1 ? "s" : ""}` : ""
              }${atencao > 0 ? ` · ${atencao} de atenção` : ""}`
        }
      />

      {/*
        Não existe "marcar como lido": todo aviso é calculado do estado atual
        da clínica e some sozinho quando o motivo dele é resolvido.
      */}
      {items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="Tudo em dia"
            text="Nenhuma conversa esperando, nenhum item para repor e nada vencido."
            icon={<IconBell className="h-8 w-8" />}
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ key: "todos", label: "Todos", count: items.length }].concat(
              grupos.map((g) => ({
                key: g,
                label: g,
                count: items.filter((i) => i.group === g).length,
              })),
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setGrupo(f.key)}
                className={`cursor-pointer rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                  grupo === f.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {f.label}
                <span className={grupo === f.key ? "ml-1.5 text-white/60" : "ml-1.5 text-zinc-400"}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <Card className="p-0">
            <div className="divide-y divide-zinc-100">
              {visiveis.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${TOM[n.tone].dot}`} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{n.title}</p>
                    <p className="truncate text-xs text-zinc-400">{n.detail}</p>
                  </div>

                  <span className="hidden shrink-0 sm:block">
                    <Tag tone={TOM[n.tone].tag}>{n.group}</Tag>
                  </span>

                  <IconArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

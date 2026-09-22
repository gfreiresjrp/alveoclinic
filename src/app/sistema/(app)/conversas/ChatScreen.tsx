"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconSearch, IconSend, IconBack } from "@/components/Icons";
import { initials } from "@/lib/format";
import { site } from "@/lib/site";
import { EmojiPicker } from "./EmojiPicker";
import { AudioRecorder } from "./AudioRecorder";
import { AudioMessage } from "./AudioMessage";
import { closeConversation, returnToAi, sendStaffMessage, takeOver } from "./actions";

type Conversation = {
  id: string;
  phone: string;
  contactName: string | null;
  status: string;
  handoffReason: string | null;
  patientId: string | null;
  lastText: string | null;
  lastRole: string | null;
  lastAt: string | null;
};

type Active = Omit<Conversation, "lastText" | "lastRole" | "lastAt">;

type Message = {
  id: string;
  role: string;
  kind: string;
  text: string;
  durationMs: number | null;
  createdAt: string;
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "ai", label: site.ai },
  { key: "human", label: "Equipe" },
  { key: "closed", label: "Encerradas" },
] as const;

function hour(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "hoje", "ontem" ou a data — o separador que divide a conversa por dia. */
function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Hoje";
  if (sameDay(date, yesterday)) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function listStamp(iso: string | null) {
  if (!iso) return "";
  const label = dayLabel(iso);
  return label === "Hoje" ? hour(iso) : label;
}

export function ChatScreen({
  conversations,
  active,
  messages,
  connected,
  explicitSelection,
}: {
  conversations: Conversation[];
  active: Active | null;
  messages: Message[];
  connected: boolean;
  explicitSelection: boolean;
}) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [active?.id, messages.length]);

  const visible = conversations.filter((c) => {
    const matchesFilter = filter === "all" || c.status === filter;
    const haystack = `${c.contactName ?? ""} ${c.phone}`.toLowerCase();
    return matchesFilter && haystack.includes(term.trim().toLowerCase());
  });

  function send() {
    if (!active || !text.trim()) return;
    const content = text;
    setText("");
    startTransition(async () => {
      await sendStaffMessage(active.id, content);
    });
  }

  /** Insere o emoji onde o cursor está, não no fim do texto. */
  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    if (!input) {
      setText((t) => t + emoji);
      return;
    }
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  return (
    <div className="flex h-[calc(100svh-var(--app-header))] w-full overflow-hidden bg-white">
      {/* ----- lista ----- */}
      <aside
        className={`w-full shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex lg:w-[360px] ${
          explicitSelection ? "hidden lg:flex" : "flex"
        }`}
      >
        <header className="shrink-0 px-4 pb-3 pt-4">
          <h1 className="font-display text-lg font-semibold tracking-tight text-zinc-900">
            Conversas
          </h1>

          <div className="relative mt-3">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Pesquisar"
              className="chat-search"
            />
          </div>

          <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer whitespace-nowrap pb-1 text-[13px] transition-colors ${
                  filter === f.key
                    ? "border-b border-zinc-900 font-medium text-zinc-900"
                    : "border-b border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-100">
          {visible.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-zinc-400">Nada por aqui.</p>
          )}

          {visible.map((c) => {
            const selected = active?.id === c.id;
            const prefix =
              c.lastRole === "patient" ? "" : c.lastRole === "ai" ? `${site.ai}: ` : "Você: ";

            return (
              <Link
                key={c.id}
                href={`/sistema/conversas?c=${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  selected ? "bg-zinc-50" : "hover:bg-zinc-50/70"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500">
                  {initials(c.contactName ?? "?")}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-zinc-900">
                      {c.contactName ?? c.phone}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-400">
                      {listStamp(c.lastAt)}
                    </span>
                  </span>

                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-zinc-500">
                      {c.lastText ? `${prefix}${c.lastText}` : "Sem mensagens"}
                    </span>
                    {c.status === "human" && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#25d366]" />
                    )}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ----- conversa ----- */}
      <section
        className={`min-w-0 flex-1 flex-col ${explicitSelection ? "flex" : "hidden lg:flex"}`}
      >
        {!active ? (
          <div className="chat-wallpaper flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
              src="/illustrations/chat-empty.svg"
              alt=""
              width={320}
              height={200}
              unoptimized
              className="h-40 w-auto opacity-90"
            />
            <p className="text-sm text-zinc-500">Escolha uma conversa para começar</p>
          </div>
        ) : (
          <>
            <header className="flex h-[57px] shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
              <Link
                href="/sistema/conversas"
                aria-label="Voltar"
                className="-ml-1 text-zinc-500 lg:hidden"
              >
                <IconBack className="h-5 w-5" />
              </Link>

              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-500">
                {initials(active.contactName ?? "?")}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {active.contactName ?? active.phone}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {active.status === "ai"
                    ? `${site.ai} atendendo`
                    : active.status === "human"
                      ? active.handoffReason ?? "com a equipe"
                      : "encerrada"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {active.patientId && (
                  <Link
                    href={`/sistema/pacientes/${active.patientId}`}
                    className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:block"
                  >
                    Ficha
                  </Link>
                )}
                {active.status === "ai" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => void (await takeOver(active.id)))}
                    className="cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                  >
                    Assumir
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => void (await returnToAi(active.id)))}
                    className="cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                  >
                    Devolver à {site.ai}
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => void (await closeConversation(active.id)))
                  }
                  className="cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                >
                  Encerrar
                </button>
              </div>
            </header>

            <div className="chat-wallpaper min-h-0 flex-1 overflow-y-auto px-[6%] py-5">
              <div className="flex flex-col gap-0.5">
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const outgoing = m.role !== "patient";
                  const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
                  const tail = !prev || prev.role !== m.role || newDay;

                  return (
                    <div key={m.id} className="contents">
                      {newDay && (
                        <span className="chat-divider my-4">{dayLabel(m.createdAt)}</span>
                      )}

                      <div
                        className={`bubble ${outgoing ? "bubble-out" : "bubble-in"} ${
                          tail ? "has-tail mt-2" : ""
                        }`}
                      >
                        {outgoing && tail && (
                          <p
                            className={`mb-0.5 text-[12px] font-medium ${
                              m.role === "ai" ? "text-[#1d6b44]" : "text-[#9a4d86]"
                            }`}
                          >
                            {m.role === "ai" ? site.ai : "Equipe"}
                          </p>
                        )}

                        {m.kind === "audio" ? (
                          <>
                            <AudioMessage messageId={m.id} durationMs={m.durationMs} />
                            <span className="bubble-time -mt-1">{hour(m.createdAt)}</span>
                          </>
                        ) : (
                          <>
                            {m.text}
                            <span className="bubble-time">{hour(m.createdAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </div>

            {(error || !connected) && (
              <p className="shrink-0 border-t border-zinc-100 bg-white px-4 py-2 text-center text-xs text-zinc-400">
                {error ||
                  "WhatsApp não conectado — as respostas ficam salvas, mas não chegam ao paciente."}
              </p>
            )}

            <div className="flex shrink-0 items-end gap-1.5 border-t border-zinc-200 bg-white px-3 py-2.5">
              <EmojiPicker onPick={insertEmoji} />

              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Mensagem"
                className="chat-composer max-h-32 flex-1 resize-none"
              />

              {text.trim() ? (
                <button
                  type="button"
                  onClick={send}
                  disabled={pending}
                  aria-label="Enviar"
                  className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-[#25d366] text-white transition-colors hover:bg-[#1eb855] disabled:opacity-40"
                >
                  <IconSend className="h-4 w-4" />
                </button>
              ) : (
                <AudioRecorder conversationId={active.id} onError={setError} />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { IconCheck } from "./Icons";

type Msg = { from: "paciente" | "ia"; text: string };

const script: Msg[] = [
  { from: "paciente", text: "Oi, vocês fazem clareamento? Quanto custa a avaliação?" },
  {
    from: "ia",
    text: "Oi! Sou a Íris, assistente virtual da clínica 🙂 Fazemos sim. A avaliação custa R$ 120 e já sai com o plano de tratamento.",
  },
  { from: "paciente", text: "Tem horário no sábado de manhã?" },
  {
    from: "ia",
    text: "Tenho com a Dra. Helena às 9h ou às 10h30 no sábado (28). Qual fica melhor?",
  },
  { from: "paciente", text: "9h tá ótimo" },
  {
    from: "ia",
    text: "Agendado! Sábado, 28, às 9h com a Dra. Helena. Te mando um lembrete na véspera 💚",
  },
];

/** Passo da animação: quantas mensagens já apareceram e se alguém está digitando. */
type Step = { count: number; typing: boolean };

export function ChatMock() {
  const [step, setStep] = useState<Step>({ count: 0, typing: false });
  const { count, typing } = step;

  useEffect(() => {
    // Fim do roteiro: espera e recomeça.
    if (count >= script.length) {
      const t = setTimeout(() => setStep({ count: 0, typing: false }), 6000);
      return () => clearTimeout(t);
    }

    // Antes de cada mensagem, mostra o indicador de digitação.
    if (!typing) {
      const t = setTimeout(() => setStep({ count, typing: true }), 350);
      return () => clearTimeout(t);
    }

    const delay = script[count].from === "ia" ? 1100 : 800;
    const t = setTimeout(() => setStep({ count: count + 1, typing: false }), delay);
    return () => clearTimeout(t);
  }, [count, typing]);

  const visible = script.slice(0, count);
  const showTyping = typing && count < script.length && script[count].from === "ia";

  return (
    <div className="card-surface relative w-full max-w-sm rounded-[2rem] p-3 shadow-card">
      <div className="flex items-center gap-3 rounded-[1.5rem] bg-navy-deep/80 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-sm font-bold text-navy">
          {site.ai.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{site.ai} · Clínica</p>
          <p className="flex items-center gap-1.5 text-[11px] text-lime">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            online agora
          </p>
        </div>
      </div>

      <div className="flex min-h-[340px] flex-col justify-end gap-2.5 px-2 py-4">
        {visible.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.from === "ia"
                ? "self-end rounded-br-md bg-lime/15 text-white"
                : "self-start rounded-bl-md bg-white/8 text-white/85"
            }`}
          >
            {m.text}
            {m.from === "ia" && <IconCheck className="ml-1.5 inline h-3 w-3 text-lime" />}
          </div>
        ))}

        {showTyping && (
          <div className="self-end rounded-2xl rounded-br-md bg-lime/10 px-4 py-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-lime animate-typing"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-[1.5rem] border border-lime/20 bg-lime/[0.06] px-4 py-3">
        <IconCheck className="h-4 w-4 shrink-0 text-lime" />
        <p className="text-[11px] leading-snug text-white/75">
          Agendamento gravado na agenda da Dra. Helena
          <span className="block text-white/45">sáb, 28 · 09:00 · Avaliação + clareamento</span>
        </p>
      </div>
    </div>
  );
}

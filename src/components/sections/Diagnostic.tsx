"use client";

import { useState } from "react";
import { Section, SectionHeading, Eyebrow } from "../ui";
import { IconArrowRight, IconCheck, IconWhatsApp } from "../Icons";
import { quiz, site } from "@/lib/site";

/** Formata o telefone enquanto o usuário digita: (11) 91234-5678 */
function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function Diagnostic() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const total = quiz.length;
  const isForm = step === total;
  const progress = ((isForm ? total : step) / total) * 100;

  function pick(option: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = option;
      return next;
    });
    setStep((s) => s + 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const resumo = quiz
      .map((q, i) => `• ${q.question} ${answers[i] ?? "—"}`)
      .join("\n");

    const text = `Olá! Sou ${name} e quero conhecer a ${site.ai}.\n\nMeu diagnóstico:\n${resumo}\n\nMeu WhatsApp: ${phone}`;

    window.open(
      `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener",
    );
  }

  const valid = name.trim().length > 2 && phone.replace(/\D/g, "").length >= 10;

  return (
    <Section id="diagnostico">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Diagnóstico em 1 minuto"
          title={
            <>
              Responda 4 perguntas e veja a {site.ai} atendendo{" "}
              <span className="text-lime">com os dados da sua clínica</span>
            </>
          }
          description="Sem compromisso. A gente monta uma demonstração com os seus procedimentos, os seus valores e a sua agenda."
        />

        <div className="card-surface rounded-[1.75rem] p-7 sm:p-9">
          {/* progresso */}
          <div className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <Eyebrow>
                {isForm ? "Última etapa" : `Etapa ${step + 1} de ${total}`}
              </Eyebrow>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="cursor-pointer text-xs text-white/50 transition-colors hover:text-white"
                >
                  Voltar
                </button>
              )}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!isForm ? (
            <>
              <h3 className="font-display text-xl font-semibold leading-snug text-white">
                {quiz[step].question}
              </h3>
              <div className="mt-6 space-y-2.5">
                {quiz[step].options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => pick(option)}
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-sm text-white/85 transition-all hover:border-lime/50 hover:bg-lime/[0.07]"
                  >
                    {option}
                    <IconArrowRight className="h-4 w-4 shrink-0 text-lime opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={submit}>
              <h3 className="font-display text-xl font-semibold leading-snug text-white">
                Para onde mandamos a demonstração?
              </h3>
              <p className="mt-2 text-sm text-muted">
                Um especialista chama você no WhatsApp com a {site.ai} já configurada.
              </p>

              <div className="mt-6 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/35 focus:border-lime/60 focus:outline-none"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-white/35 focus:border-lime/60 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!valid}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-lime px-6 py-4 text-sm font-semibold text-navy transition-all hover:bg-lime-bright disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconWhatsApp className="h-4 w-4" />
                Quero ver a {site.ai} atendendo
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                <IconCheck className="h-3 w-3 text-lime" />
                Seus dados são usados só para este contato, na forma da LGPD.
              </p>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

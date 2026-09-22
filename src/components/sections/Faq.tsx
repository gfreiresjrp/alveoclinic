"use client";

import { useState } from "react";
import { Section, SectionHeading } from "../ui";
import { IconChevron } from "../Icons";
import { faq } from "@/lib/site";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq">
      <SectionHeading
        center
        eyebrow="FAQ"
        title="Tudo que você precisa saber"
        description="As perguntas que todo mundo faz antes de deixar uma inteligência artificial conversar com os próprios pacientes."
      />

      <div className="mx-auto mt-14 max-w-3xl space-y-3">
        {faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={`card-surface overflow-hidden rounded-2xl transition-colors ${
                isOpen ? "border-lime/30" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-base font-semibold text-white sm:text-lg">
                  {item.q}
                </span>
                <IconChevron
                  className={`h-5 w-5 shrink-0 text-lime transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted sm:text-base">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

import { Section, SectionHeading } from "../ui";
import { Reveal } from "../Reveal";
import { stats, statsSource } from "@/lib/site";

export function Stats() {
  return (
    <Section id="por-que">
      <SectionHeading
        center
        eyebrow="Por que isso importa"
        title={
          <>
            O paciente não espera. Ele marca com quem{" "}
            <span className="text-lime">responde primeiro</span>.
          </>
        }
        description="O que os dados dizem sobre o comportamento de quem procura uma clínica hoje."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.value} delay={i * 90}>
            <div className="card-surface h-full rounded-2xl p-6 transition-colors hover:border-lime/30">
              <p className="font-display text-4xl font-extrabold text-lime sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/35">{statsSource}</p>
    </Section>
  );
}

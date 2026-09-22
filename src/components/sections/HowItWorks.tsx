import { Section, SectionHeading, Cta } from "../ui";
import { Reveal } from "../Reveal";
import { steps, site } from "@/lib/site";

export function HowItWorks() {
  return (
    <Section id="como-funciona">
      <SectionHeading
        center
        eyebrow="Como funciona"
        title="Da primeira mensagem ao horário marcado, na mesma conversa"
      />

      <ol className="relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* linha de conexão no desktop */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-lime/25 to-transparent lg:block"
        />

        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 100}>
            <li className="relative h-full">
              <span className="font-display relative z-10 grid h-12 w-12 place-items-center rounded-full border border-lime/30 bg-navy text-lg font-bold text-lime">
                {i + 1}
              </span>
              <h3 className="font-display mt-5 text-lg font-semibold leading-snug text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>

      <div className="mt-14 flex justify-center">
        <Cta href="#diagnostico" withArrow>
          Ver a {site.ai} atendendo
        </Cta>
      </div>
    </Section>
  );
}

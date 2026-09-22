import { Section, Cta } from "../ui";
import { Reveal } from "../Reveal";
import { IconCheck } from "../Icons";
import { site } from "@/lib/site";

const perks = ["Teste grátis por 7 dias", "Garantia de 30 dias", "Configuração acompanhada"];

export function FinalCta() {
  return (
    <Section>
      <Reveal>
        <div className="glow-ring relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-navy-deep to-navy px-7 py-16 text-center sm:px-14">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-lime/12 blur-3xl"
          />

          <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-bold leading-[1.14] tracking-tight text-white sm:text-4xl">
            A sua clínica pode estar respondendo pacientes agora, enquanto você atende.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
            Fale com um especialista e veja a {site.ai} atendendo com os procedimentos,
            os valores e a agenda da sua clínica.
          </p>

          <div className="relative mt-9 flex justify-center">
            <Cta href="#diagnostico" withArrow>
              Falar com um especialista
            </Cta>
          </div>

          <ul className="relative mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-xs text-white/60">
                <IconCheck className="h-3.5 w-3.5 text-lime" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

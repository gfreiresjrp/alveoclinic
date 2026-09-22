import { Section, SectionHeading } from "../ui";
import { Reveal } from "../Reveal";
import { compliance } from "@/lib/site";
import { IconShield, IconLock, IconCheck, IconEye } from "../Icons";

const icons = [IconShield, IconLock, IconCheck, IconEye];

export function Compliance() {
  return (
    <Section id="seguranca">
      <SectionHeading
        center
        eyebrow="Segurança"
        title={
          <>
            IA falando com o seu paciente,{" "}
            <span className="text-lime">dentro das regras</span> do CFM e da LGPD
          </>
        }
        description="Quando a inteligência artificial atende, conformidade deixa de ser detalhe. Veja como isso foi desenhado."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {compliance.map((item, i) => {
          const Icon = icons[i];
          return (
            <Reveal key={item.title} delay={(i % 2) * 90}>
              <div className="card-surface h-full rounded-2xl p-7 transition-colors hover:border-lime/30">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-5 text-lg font-semibold leading-snug text-white">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

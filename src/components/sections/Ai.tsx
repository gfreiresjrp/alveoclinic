import { Section, SectionHeading } from "../ui";
import { Reveal } from "../Reveal";
import { aiSkills, site } from "@/lib/site";
import {
  IconClock,
  IconChat,
  IconSpark,
  IconCalendar,
  IconCheck,
  IconUsers,
} from "../Icons";

const icons = [IconClock, IconChat, IconSpark, IconCalendar, IconCheck, IconUsers];

export function Ai() {
  return (
    <Section id="a-ia">
      <SectionHeading
        eyebrow={`A ${site.ai}`}
        title={
          <>
            Não é um bot de menu. É{" "}
            <span className="text-lime">quem atende a sua clínica</span>.
          </>
        }
        description={`A ${site.ai} faz o pré-atendimento inteiro: recebe o paciente, entende o que ele precisa, resolve o que dá para resolver e só chama você quando vale a pena.`}
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {aiSkills.map((skill, i) => {
          const Icon = icons[i];
          return (
            <Reveal key={skill.title} delay={(i % 3) * 90}>
              <div className="card-surface group h-full rounded-2xl p-6 transition-colors hover:border-lime/30">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime transition-colors group-hover:bg-lime/20">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-5 text-base font-semibold text-white">
                  {skill.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{skill.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

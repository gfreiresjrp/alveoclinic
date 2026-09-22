import { Section, SectionHeading } from "../ui";
import { Reveal } from "../Reveal";
import { platform, site } from "@/lib/site";
import {
  IconCalendar,
  IconRecord,
  IconPill,
  IconChart,
  IconDoc,
  IconGlobe,
  IconVideo,
  IconMic,
  IconSpark,
} from "../Icons";

const icons = [
  IconCalendar,
  IconRecord,
  IconPill,
  IconChart,
  IconDoc,
  IconGlobe,
  IconVideo,
  IconMic,
  IconSpark,
];

export function Platform() {
  return (
    <Section id="plataforma">
      <SectionHeading
        eyebrow="A plataforma"
        title={
          <>
            A {site.ai} agenda de verdade porque{" "}
            <span className="text-lime">mora dentro do sistema</span> da sua clínica
          </>
        }
        description="Ela não é um robô plugado por fora. Está no mesmo lugar que a sua agenda, o seu prontuário e o seu financeiro — e é por isso que sabe quem atende, quando e o quê."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platform.map((item, i) => {
          const Icon = icons[i];
          return (
            <Reveal key={item.title} delay={(i % 3) * 80}>
              <div className="card-surface flex h-full items-start gap-4 rounded-2xl p-5 transition-colors hover:border-lime/30">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-lime">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{item.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

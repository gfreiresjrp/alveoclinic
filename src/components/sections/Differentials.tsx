import { Section, SectionHeading } from "../ui";
import { differentials, site } from "@/lib/site";
import { IconCheck } from "../Icons";

export function Differentials() {
  const loop = [...differentials, ...differentials, ...differentials];

  return (
    <Section className="overflow-hidden">
      <SectionHeading
        center
        eyebrow="Diferenciais"
        title="Você não recebe um bot e um manual"
        description={`A ${site.ai} entra no ar já treinada com os procedimentos, os valores e as regras de agenda da sua clínica — e com gente de verdade acompanhando.`}
      />

      <div className="relative mt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0a1a33] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0a1a33] to-transparent"
        />

        <div className="flex w-max animate-marquee gap-4">
          {loop.map((item, i) => (
            <span
              key={i}
              className="card-surface flex items-center gap-2.5 whitespace-nowrap rounded-full px-6 py-3.5 text-sm font-medium text-white/85"
            >
              <IconCheck className="h-4 w-4 text-lime" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

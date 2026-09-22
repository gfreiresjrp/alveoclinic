import { Badge, Cta } from "../ui";
import { ChatMock } from "../ChatMock";
import { Reveal } from "../Reveal";
import { IconChat, IconCalendar, IconSpark } from "../Icons";
import { site } from "@/lib/site";

const pills = [
  { icon: IconChat, label: "Atende 24h no WhatsApp" },
  { icon: IconCalendar, label: "Agenda dentro do seu sistema" },
  { icon: IconSpark, label: "Treinada com a sua clínica" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div className="container-x grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Reveal>
            <Badge>{site.tagline}</Badge>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-[3.5rem]">
              A IA que atende o seu paciente em segundos e já sai da conversa{" "}
              <span className="lime-underline">com a consulta marcada</span>.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              A {site.ai} é a IA de pré-atendimento da sua clínica. Ela responde no
              WhatsApp 24 horas por dia, tira as dúvidas do paciente, qualifica e
              agenda direto na sua agenda — e chama a sua equipe quando o caso
              precisa de gente.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Cta href="#diagnostico" withArrow>
                Ver a {site.ai} atendendo
              </Cta>
              <Cta href="#como-funciona" variant="secondary">
                Como funciona
              </Cta>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {pills.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-white/70">
                  <Icon className="h-4 w-4 text-lime" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-lime/10 blur-3xl" />
            <ChatMock />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

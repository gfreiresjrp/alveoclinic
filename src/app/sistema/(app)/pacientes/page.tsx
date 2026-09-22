import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getInsurances, getPatientsOverview } from "@/lib/queries";
import { PageHeader, EmptyState, StatCard, Tag } from "@/components/app/ui";
import { IconArrowRight, IconAlert } from "@/components/Icons";
import { age, initials, isoDate, money, shortDate } from "@/lib/format";
import { NewPatientButton } from "./NewPatientButton";
import { PatientFilters } from "./PatientFilters";

export const metadata: Metadata = { title: "Pacientes", robots: { index: false } };

/** Dia e mês, para comparar aniversário sem depender do ano. */
function dayMonth(date: string) {
  return date.slice(5);
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; convenio?: string; situacao?: string; ordem?: string }>;
}) {
  const { clinic } = await requireSession();
  const { q = "", convenio = "", situacao = "", ordem = "nome" } = await searchParams;

  const today = isoDate(new Date());
  const monthPrefix = today.slice(0, 7);

  const [rows, insurances] = await Promise.all([
    getPatientsOverview(clinic.id, { term: q, insurance: convenio, today }),
    getInsurances(clinic.id),
  ]);

  const withDebt = rows.filter((p) => p.openCents > 0);
  const withReturn = rows.filter((p) => p.nextVisit);
  const newThisMonth = rows.filter(
    (p) => isoDate(p.createdAt).slice(0, 7) === monthPrefix,
  );
  const birthdays = rows.filter(
    (p) => p.birthDate && dayMonth(p.birthDate).slice(0, 2) === today.slice(5, 7),
  );

  const filtered = rows.filter((p) => {
    if (situacao === "devendo") return p.openCents > 0;
    if (situacao === "retorno") return Boolean(p.nextVisit);
    if (situacao === "sem-retorno") return !p.nextVisit;
    if (situacao === "aniversario")
      return p.birthDate && dayMonth(p.birthDate).slice(0, 2) === today.slice(5, 7);
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (ordem === "recentes") return b.createdAt.getTime() - a.createdAt.getTime();
    if (ordem === "ultima-visita") return (b.lastVisit ?? "").localeCompare(a.lastVisit ?? "");
    if (ordem === "devedores") return b.openCents - a.openCents;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pacientes"
        subtitle={`${rows.length} ${rows.length === 1 ? "paciente" : "pacientes"} na base`}
        action={<NewPatientButton />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Novos no mês" value={String(newThisMonth.length)} />
        <StatCard
          label="Com retorno marcado"
          value={String(withReturn.length)}
          hint={`${rows.length - withReturn.length} sem próxima consulta`}
          tone="positive"
        />
        <StatCard
          label="Com valor em aberto"
          value={String(withDebt.length)}
          hint={money(withDebt.reduce((sum, p) => sum + p.openCents, 0))}
          tone={withDebt.length > 0 ? "warning" : "default"}
        />
        <StatCard label="Aniversariantes do mês" value={String(birthdays.length)} />
      </div>

      <PatientFilters
        search={q}
        insurance={convenio}
        situation={situacao}
        order={ordem}
        insurances={insurances}
      />

      {sorted.length === 0 ? (
        <EmptyState
          art="/illustrations/no-results.svg"
          title="Nenhum paciente encontrado"
          text="Ajuste a busca ou os filtros para ver outros pacientes."
        />
      ) : (
        <div className="panel divide-y divide-zinc-100 p-0">
          {sorted.map((p) => {
            const years = age(p.birthDate);
            const birthdayToday = p.birthDate && dayMonth(p.birthDate) === dayMonth(today);

            return (
              <Link
                key={p.id}
                href={`/sistema/pacientes/${p.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-zinc-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                  {initials(p.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    <span className="truncate">{p.name}</span>
                    {birthdayToday && <span title="Faz aniversário hoje">🎂</span>}
                    {p.healthNotes && (
                      <IconAlert
                        className="h-3.5 w-3.5 shrink-0 text-amber-500"
                        aria-label="Tem observação de anamnese"
                      />
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {p.phone}
                    {years !== null && ` · ${years} anos`}
                    {p.insurance ? ` · ${p.insurance}` : " · Particular"}
                  </p>
                </div>

                <div className="hidden w-32 shrink-0 text-xs md:block">
                  <p className="text-zinc-400">Última visita</p>
                  <p className="text-zinc-700">
                    {p.lastVisit ? shortDate(p.lastVisit) : "—"}
                  </p>
                </div>

                <div className="hidden w-32 shrink-0 text-xs md:block">
                  <p className="text-zinc-400">Próxima</p>
                  <p className={p.nextVisit ? "text-zinc-700" : "text-zinc-400"}>
                    {p.nextVisit ? shortDate(p.nextVisit) : "sem retorno"}
                  </p>
                </div>

                <div className="w-24 shrink-0 text-right">
                  {p.openCents > 0 ? (
                    <Tag tone="late">{money(p.openCents)}</Tag>
                  ) : (
                    <span className="text-xs text-zinc-300">em dia</span>
                  )}
                </div>

                <IconArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

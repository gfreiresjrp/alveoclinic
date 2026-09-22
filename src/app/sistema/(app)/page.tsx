import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import {
  countPatients,
  getAppointments,
  getConversations,
  getDueReminders,
  getFinance,
  getOverdue,
} from "@/lib/queries";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { isIrisConfigured } from "@/lib/iris";
import {
  Card,
  CardTitle,
  GreetingHeader,
  StatCard,
  Tag,
  EmptyState,
  APPOINTMENT_STATUS,
} from "@/components/app/ui";
import { DailyBars } from "./DailyBars";
import {
  addDays,
  hhmm,
  isoDate,
  greeting,
  weekdayLongDate,
  money,
  monthRange,
  percentChange,
  shortDate,
  initials,
} from "@/lib/format";
import {
  IconArrowRight,
  IconChat,
  IconCalendar,
  IconTrend,
  IconMoney,
  IconQr,
  IconClock,
} from "@/components/Icons";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Visão geral", robots: { index: false } };

export default async function Dashboard() {
  const { clinic, user } = await requireSession();

  const today = isoDate(new Date());
  const tomorrow = addDays(today, 1);
  const thisMonth = monthRange(0);
  const lastMonth = monthRange(-1);

  const [
    todayItems,
    tomorrowItems,
    monthItems,
    prevItems,
    finance,
    prevFinance,
    overdue,
    convs,
    patientCount,
    dueReminders,
  ] = await Promise.all([
    getAppointments(clinic.id, today, today),
    getAppointments(clinic.id, tomorrow, tomorrow),
    getAppointments(clinic.id, thisMonth.from, thisMonth.to),
    getAppointments(clinic.id, lastMonth.from, lastMonth.to),
    getFinance(clinic.id, thisMonth.from, thisMonth.to),
    getFinance(clinic.id, lastMonth.from, lastMonth.to),
    getOverdue(clinic.id, today),
    getConversations(clinic.id),
    countPatients(clinic.id),
    getDueReminders(clinic.id, today),
  ]);

  const attended = monthItems.filter((a) => a.status === "attended").length;
  const prevAttended = prevItems.filter((a) => a.status === "attended").length;

  const byAi = monthItems.filter((a) => a.source === "ai").length;
  const prevByAi = prevItems.filter((a) => a.source === "ai").length;
  const aiShare = monthItems.length ? Math.round((byAi / monthItems.length) * 100) : 0;

  // Quitado vale pelo total; parcial vale pelo que já entrou.
  const entrou = (f: { paidAt: string | null; amountCents: number; paidCents: number }) =>
    f.paidAt ? f.amountCents : f.paidCents;

  const received = finance
    .filter((f) => f.type === "income")
    .reduce((s, f) => s + entrou(f), 0);
  const prevReceived = prevFinance
    .filter((f) => f.type === "income")
    .reduce((s, f) => s + entrou(f), 0);

  const closed = monthItems.filter((a) => a.status === "attended" || a.status === "noshow");
  const noShows = closed.filter((a) => a.status === "noshow").length;
  const noShowRate = closed.length ? Math.round((noShows / closed.length) * 100) : 0;
  const averageTicket = attended ? Math.round(received / attended) : 0;

  // Série do gráfico: um ponto por dia do mês corrente.
  const daysInMonth = Number(thisMonth.to.slice(8));
  const perDay = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${thisMonth.from.slice(0, 8)}${String(i + 1).padStart(2, "0")}`;
    return { date, count: monthItems.filter((a) => a.date === date).length };
  });

  // Procedimentos mais feitos no mês.
  const procedureCount = new Map<string, number>();
  for (const a of monthItems) {
    const name = a.procedureName ?? "Consulta";
    procedureCount.set(name, (procedureCount.get(name) ?? 0) + 1);
  }
  const topProcedures = [...procedureCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const waitingHuman = convs.filter((c) => c.status === "human");
  const toConfirm = tomorrowItems.filter((a) => a.status === "scheduled");
  const firstName = user.name.split(" ")[0].replace(/^Dr[a]?\.\s*/, "");

  return (
    <div className="space-y-5">
      <GreetingHeader
        title={`${greeting()}, ${firstName}.`}
        date={weekdayLongDate(today)}
      />

      {!isWhatsAppConfigured() && (
        <div className="panel flex flex-wrap items-center gap-4 p-5">
          <Image
            src="/illustrations/whatsapp.svg"
            alt=""
            width={150}
            height={100}
            unoptimized
            className="h-20 w-auto shrink-0"
          />
          <div className="min-w-[240px] flex-1">
            <p className="font-display text-base font-semibold text-slate-900">
              Conecte seu WhatsApp
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {isIrisConfigured()
                ? `A ${site.ai} já está configurada. Falta ligar o número da clínica para ela começar a atender.`
                : `Falta a chave da API para a ${site.ai} responder e o número da clínica para ela atender.`}
            </p>
          </div>
          <Link
            href={isIrisConfigured() ? "/sistema/configuracoes" : "/sistema/iris"}
            className="btn btn-primary"
          >
            <IconQr className="h-4 w-4" />
            {isIrisConfigured() ? "Conectar agora" : "Ver a Íris"}
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Atendimentos"
          value={String(attended)}
          delta={percentChange(attended, prevAttended)}
          icon={<IconChat className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Agendamentos"
          value={String(monthItems.length)}
          delta={percentChange(monthItems.length, prevItems.length)}
          icon={<IconCalendar className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label={`Marcados pela ${site.ai}`}
          value={`${aiShare}%`}
          delta={percentChange(byAi, prevByAi)}
          icon={<IconTrend className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Receita recebida"
          value={money(received)}
          delta={percentChange(received, prevReceived)}
          icon={<IconMoney className="h-[18px] w-[18px]" />}
        />
      </div>

      {/* movimento do mês */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <CardTitle>Atendimentos por dia</CardTitle>

          <div className="flex gap-8">
            <div>
              <p className="text-xs text-zinc-500">Ticket médio</p>
              <p className="font-display text-lg font-semibold text-zinc-900">
                {money(averageTicket)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Taxa de falta</p>
              <p
                className={`font-display text-lg font-semibold ${
                  noShowRate > 15 ? "text-rose-600" : "text-zinc-900"
                }`}
              >
                {noShowRate}%
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Faltas no mês</p>
              <p className="font-display text-lg font-semibold text-zinc-900">{noShows}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <DailyBars data={perDay} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <CardTitle>Agenda de hoje</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {todayItems.length === 0
                  ? "Nada marcado ainda"
                  : `${todayItems.length} ${todayItems.length === 1 ? "atendimento" : "atendimentos"}`}
              </p>
            </div>
            <Link
              href="/sistema/agenda"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              Ver agenda completa
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {todayItems.length === 0 && (
              <EmptyState
                art="/illustrations/free-day.svg"
                title="Agenda livre hoje"
                text="Quando a Íris ou a recepção marcarem, o atendimento aparece aqui."
              />
            )}

            {todayItems.map((a) => (
              <Link
                key={a.id}
                href={`/sistema/pacientes/${a.patientId}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="font-display w-12 shrink-0 text-sm font-bold text-slate-900">
                  {hhmm(a.startMin)}
                </span>
                <span
                  className="h-9 w-[3px] shrink-0 rounded-full"
                  style={{ backgroundColor: a.dentistColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{a.patientName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {a.procedureName ?? "Consulta"} · {a.dentistName}
                  </p>
                </div>
                <Tag tone={a.status}>{APPOINTMENT_STATUS[a.status]}</Tag>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <Image
            src="/illustrations/ai.svg"
            alt=""
            width={220}
            height={140}
            unoptimized
            className="h-24 w-auto"
          />

          {/* Verde só quando ela pode mesmo atender; sem WhatsApp ligado, é aviso. */}
          <span
            className={`mt-5 inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              isWhatsAppConfigured()
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isWhatsAppConfigured() ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isWhatsAppConfigured() ? "IA ativa" : "Aguardando conexão"}
          </span>

          <h2 className="font-display mt-3 text-xl font-bold text-slate-900">{site.ai}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {byAi > 0
              ? `Ela marcou ${byAi} ${byAi === 1 ? "consulta" : "consultas"} neste mês sem passar pela recepção.`
              : "Assim que as conversas começarem, o resultado dela aparece aqui."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div>
              <p className="font-display text-2xl font-bold text-slate-900">{aiShare}%</p>
              <p className="mt-1 text-xs text-slate-500">dos agendamentos</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-slate-900">
                {waitingHuman.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">esperando a equipe</p>
            </div>
          </div>

          <Link href="/sistema/conversas" className="btn btn-secondary mt-6 w-fit">
            Ver conversas
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <CardTitle>Amanhã</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {toConfirm.length > 0
                  ? `${toConfirm.length} para confirmar`
                  : `${tomorrowItems.length} ${tomorrowItems.length === 1 ? "atendimento" : "atendimentos"}`}
              </p>
            </div>
            <Link
              href={`/sistema/agenda?vista=dia&dia=${tomorrow}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Abrir
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {tomorrowItems.length === 0 ? (
              <EmptyState icon={<IconCalendar className="h-9 w-9" />} title="Nada marcado" />
            ) : (
              tomorrowItems.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-12 shrink-0 text-sm font-semibold text-slate-900">
                    {hhmm(a.startMin)}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {a.patientName}
                  </p>
                  <Tag tone={a.status}>{APPOINTMENT_STATUS[a.status]}</Tag>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Procedimentos do mês</CardTitle>
            <p className="mt-0.5 text-sm text-slate-500">Os mais marcados</p>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {topProcedures.length === 0 ? (
              <EmptyState icon={<IconTrend className="h-9 w-9" />} title="Sem dados no mês" />
            ) : (
              topProcedures.map(([name, total]) => (
                <div key={name} className="flex items-center gap-3 px-5 py-3">
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{name}</p>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {total}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      {dueReminders.length > 0 && (
        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Lembretes para hoje</CardTitle>
            <p className="mt-0.5 text-sm text-slate-500">
              {dueReminders.length === 1
                ? "1 paciente para contatar"
                : `${dueReminders.length} pacientes para contatar`}
            </p>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {dueReminders.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/sistema/pacientes/${r.patientId}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-50 text-[10px] font-semibold text-amber-700">
                  {initials(r.patientName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{r.patientName}</p>
                  <p className="truncate text-xs text-slate-500">{r.note}</p>
                </div>
                <span className="shrink-0 text-xs text-amber-700">{shortDate(r.dueDate)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <CardTitle>Conversas recentes</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {waitingHuman.length > 0
                  ? `${waitingHuman.length} aguardando a equipe`
                  : "Nenhuma esperando a equipe"}
              </p>
            </div>
            <Link
              href="/sistema/conversas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              Ver todas
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {convs.length === 0 && (
              <EmptyState
                art="/illustrations/no-conversations.svg"
                title="Nenhuma conversa ainda"
                text="Quando um paciente chamar no WhatsApp, ela aparece aqui."
              />
            )}
            {convs.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/sistema/conversas?c=${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {initials(c.contactName ?? "??")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {c.contactName ?? c.phone}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {c.status === "human" ? c.handoffReason ?? "Com a equipe" : "Íris atendendo"}
                  </p>
                </div>
                <Tag tone={c.status}>
                  {c.status === "ai" ? site.ai : c.status === "human" ? "Equipe" : "Fechada"}
                </Tag>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <CardTitle>Cobranças em atraso</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {patientCount} pacientes cadastrados
              </p>
            </div>
            <Link
              href="/sistema/financeiro"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              Financeiro
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {overdue.length === 0 ? (
              <EmptyState
                icon={<IconClock className="h-9 w-9" />}
                title="Nada vencido"
                text="Todas as cobranças do período estão em dia."
              />
            ) : (
              overdue.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {f.patientName ?? f.description}
                    </p>
                    <p className="text-xs text-rose-600">venceu em {shortDate(f.dueDate)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {money(f.amountCents)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

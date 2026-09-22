import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  getPatient,
  getPatientFinance,
  getPatientHistory,
  getPatientDocuments,
  getPatientReminders,
} from "@/lib/queries";
import {
  Card,
  CardTitle,
  Tag,
  EmptyState,
  APPOINTMENT_STATUS,
  SOURCE_LABEL,
} from "@/components/app/ui";
import { Odontogram } from "@/components/app/Odontogram";
import { NoteComposer } from "./NoteComposer";
import { PatientHeader } from "./PatientHeader";
import { Reminders } from "./Reminders";
import { Documents } from "./Documents";
import { DOCUMENT_CATALOG } from "@/lib/documents";
import {
  ageLong,
  daysToBirthday,
  hhmm,
  isoDate,
  longDate,
  money,
  shortDate,
} from "@/lib/format";
import { IconAlert, IconCalendar, IconMoney, IconRecord } from "@/components/Icons";

export const metadata: Metadata = { title: "Ficha do paciente", robots: { index: false } };

const PLAN_STATUS: Record<string, string> = {
  draft: "Rascunho",
  presented: "Apresentado",
  accepted: "Aceito",
  in_progress: "Em andamento",
  done: "Concluído",
  refused: "Recusado",
};

const METHODS: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  transfer: "Transferência",
  insurance: "Convênio",
};

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { clinic } = await requireSession();
  const { id } = await params;
  const { aba = "visao-geral" } = await searchParams;

  const patient = await getPatient(clinic.id, id);
  if (!patient) notFound();

  const today = isoDate(new Date());
  const [{ history, notes, teeth, plans, items }, finance, reminders, docs] =
    await Promise.all([
      getPatientHistory(clinic.id, id),
      getPatientFinance(clinic.id, id),
      getPatientReminders(clinic.id, id),
      getPatientDocuments(clinic.id, id),
    ]);

  const openFinance = finance.filter((f) => f.type === "income" && !f.paidAt);
  const pendingItems = items.filter((i) => i.status === "pending");

  const counts = {
    orcamentos: plans.length,
    tratamentos: pendingItems.length,
    pagamentos: openFinance.length,
    evolucoes: notes.length,
    documentos: docs.length,
  };

  /** Monta o texto do orçamento e abre o WhatsApp do paciente já preenchido. */
  function budgetLink(
    title: string,
    planItems: { tooth: number | null; faces: string | null; procedureName: string; priceCents: number }[],
    total: number,
  ) {
    const linhas = planItems.map(
      (i) =>
        `• ${i.tooth ? `Dente ${i.tooth}` : "Geral"}${i.faces ? ` (${i.faces})` : ""} — ${i.procedureName}: ${money(i.priceCents)}`,
    );

    const texto = [
      `Olá, ${patient!.name.split(" ")[0]}! Segue o orçamento da ${clinic.name}.`,
      "",
      title,
      ...linhas,
      "",
      `Total: ${money(total)}`,
      "",
      "Qualquer dúvida é só responder por aqui.",
    ].join("\n");

    return `https://wa.me/55${patient!.phone.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
  }

  const info = [
    ["Prontuário", patient.code !== null ? String(patient.code).padStart(4, "0") : "—"],
    ["Telefone", patient.phone],
    ["E-mail", patient.email ?? "—"],
    ["CPF", patient.cpf ?? "—"],
    ["Nascimento", patient.birthDate ? shortDate(patient.birthDate) : "—"],
    ["Convênio", patient.insurance ?? "Particular"],
    ["Endereço", patient.address ?? "—"],
    ["Como nos conheceu", patient.source ?? "—"],
    ["Paciente desde", shortDate(isoDate(patient.createdAt))],
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/sistema/pacientes"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-accent"
      >
        ← Pacientes
      </Link>

      <PatientHeader
        patient={{
          id: patient.id,
          code: patient.code,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          cpf: patient.cpf,
          birthDate: patient.birthDate,
          address: patient.address,
          insurance: patient.insurance,
          healthNotes: patient.healthNotes,
          source: patient.source,
        }}
        age={ageLong(patient.birthDate)}
        daysToBirthday={daysToBirthday(patient.birthDate, today)}
        counts={counts}
        active={aba}
      />

      {/* ---------------- visão geral ---------------- */}
      {aba === "visao-geral" && (
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            {patient.healthNotes && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="text-xs font-semibold text-rose-800">Alerta de saúde</p>
                  <p className="mt-1 text-sm text-rose-900">{patient.healthNotes}</p>
                </div>
              </div>
            )}

            <Reminders
              patientId={patient.id}
              today={today}
              reminders={reminders.map((r) => ({
                id: r.id,
                dueDate: r.dueDate,
                note: r.note,
                done: r.done,
              }))}
            />

            <Card>
              <CardTitle>Informações</CardTitle>
              <dl className="mt-4 space-y-3">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-zinc-400">{label}</dt>
                    <dd className="mt-0.5 text-sm text-zinc-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardTitle
                action={<span className="text-xs text-zinc-400">Clique numa face para marcar</span>}
              >
                Odontograma
              </CardTitle>
              <div className="mt-5">
                <Odontogram
                  patientId={patient.id}
                  records={teeth.map((t) => ({
                    tooth: t.tooth,
                    face: t.face,
                    condition: t.condition,
                  }))}
                />
              </div>
            </Card>

            <Card className="p-0">
              <div className="px-5 py-4">
                <CardTitle>Últimas evoluções</CardTitle>
              </div>
              <div className="divide-y divide-zinc-100 border-t border-zinc-100">
                {notes.length === 0 ? (
                  <EmptyState
                    icon={<IconRecord className="h-9 w-9" />}
                    title="Sem evoluções registradas"
                  />
                ) : (
                  notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="px-5 py-3.5">
                      <p className="text-xs text-zinc-400">
                        {longDate(isoDate(note.createdAt))} · {note.dentistName}
                      </p>
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-zinc-700">
                        {note.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-0">
              <div className="px-5 py-4">
                <CardTitle>Histórico de consultas</CardTitle>
              </div>
              <div className="divide-y divide-zinc-100 border-t border-zinc-100">
                {history.length === 0 ? (
                  <EmptyState
                    icon={<IconCalendar className="h-9 w-9" />}
                    title="Nenhuma consulta registrada"
                  />
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3"
                    >
                      <span className="w-20 shrink-0 text-sm font-medium text-zinc-700">
                        {shortDate(h.date)}
                      </span>
                      <span className="w-12 shrink-0 text-sm text-zinc-500">
                        {hhmm(h.startMin)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                        {h.procedureName ?? "Consulta"} · {h.dentistName}
                      </span>
                      <Tag tone={h.source === "ai" ? "ai" : "scheduled"}>
                        {SOURCE_LABEL[h.source]}
                      </Tag>
                      <Tag tone={h.status}>{APPOINTMENT_STATUS[h.status]}</Tag>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------- anamnese ---------------- */}
      {aba === "anamnese" && (
        <Card>
          <CardTitle>Anamnese</CardTitle>
          <p className="mt-1 text-sm text-zinc-500">
            Alergias, medicamentos em uso e condições que a equipe precisa saber antes de
            atender. Edite pelo botão no topo da ficha.
          </p>

          <div className="mt-5">
            {patient.healthNotes ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
                <p className="text-sm leading-relaxed text-rose-900">{patient.healthNotes}</p>
              </div>
            ) : (
              <EmptyState
                icon={<IconAlert className="h-9 w-9" />}
                title="Nenhuma anamnese registrada"
                text="Sem alertas de saúde para este paciente."
              />
            )}
          </div>
        </Card>
      )}

      {/* ---------------- orçamentos ---------------- */}
      {aba === "orcamentos" && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <EmptyState
                art="/illustrations/no-data.svg"
                title="Nenhum orçamento"
                text="Os planos de tratamento apresentados aparecem aqui."
              />
            </Card>
          ) : (
            plans.map((plan) => {
              const planItems = items.filter((i) => i.planId === plan.id);
              const total =
                planItems.reduce((sum, i) => sum + i.priceCents, 0) - plan.discountCents;
              const done = planItems.filter((i) => i.status === "done").length;

              return (
                <Card key={plan.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold text-zinc-900">
                        {plan.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {plan.dentistName} · {shortDate(isoDate(plan.createdAt))} · {done} de{" "}
                        {planItems.length} executados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag
                        tone={
                          plan.status === "accepted" || plan.status === "done" ? "done" : "pending"
                        }
                      >
                        {PLAN_STATUS[plan.status]}
                      </Tag>
                      <a
                        href={budgetLink(plan.title, planItems, total)}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-secondary py-1.5 text-xs"
                      >
                        Enviar no WhatsApp
                      </a>
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-zinc-100 border-y border-zinc-100">
                    {planItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0 truncate text-sm text-zinc-700">
                          {item.tooth ? `Dente ${item.tooth}` : "Geral"}
                          {item.faces ? ` (${item.faces})` : ""} · {item.procedureName}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-sm tabular-nums text-zinc-500">
                            {money(item.priceCents)}
                          </span>
                          <Tag tone={item.status === "done" ? "done" : "pending"}>
                            {item.status === "done" ? "Feito" : "Pendente"}
                          </Tag>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {plan.discountCents > 0 && `Desconto de ${money(plan.discountCents)}`}
                    </span>
                    <span className="font-display text-base font-semibold text-zinc-900">
                      {money(total)}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ---------------- tratamentos ---------------- */}
      {aba === "tratamentos" && (
        <Card className="p-0">
          <div className="px-5 py-4">
            <CardTitle>Tratamentos</CardTitle>
            <p className="mt-0.5 text-sm text-zinc-500">
              Tudo que foi orçado, dente a dente, com o que já foi executado.
            </p>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {items.length === 0 ? (
              <EmptyState
                icon={<IconRecord className="h-9 w-9" />}
                title="Nenhum procedimento planejado"
              />
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <span className="w-24 shrink-0 text-sm font-medium text-zinc-700">
                    {item.tooth ? `Dente ${item.tooth}` : "Geral"}
                    {item.faces ? ` (${item.faces})` : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                    {item.procedureName}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                    {money(item.priceCents)}
                  </span>
                  <Tag tone={item.status === "done" ? "done" : "pending"}>
                    {item.status === "done" ? "Executado" : "Pendente"}
                  </Tag>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ---------------- pagamentos ---------------- */}
      {aba === "pagamentos" && (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <CardTitle>Pagamentos</CardTitle>
              <p className="mt-0.5 text-sm text-zinc-500">
                {openFinance.length > 0
                  ? `${money(openFinance.reduce((s, f) => s + f.amountCents, 0))} em aberto`
                  : "Nada em aberto"}
              </p>
            </div>
            <Link href="/sistema/financeiro" className="btn btn-secondary">
              Abrir financeiro
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {finance.length === 0 ? (
              <EmptyState
                icon={<IconMoney className="h-9 w-9" />}
                title="Nenhum lançamento"
                text="Cobranças deste paciente aparecem aqui."
              />
            ) : (
              finance.map((f) => {
                const state = f.paidAt ? "paid" : f.dueDate < today ? "late" : "due";
                return (
                  <div key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                    <span className="w-20 shrink-0 text-xs text-zinc-500">
                      {shortDate(f.dueDate)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-900">{f.description}</p>
                      {f.method && (
                        <p className="text-xs text-zinc-400">{METHODS[f.method]}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-900">
                      {money(f.amountCents)}
                    </span>
                    <Tag tone={state}>
                      {state === "paid" ? "Pago" : state === "late" ? "Vencido" : "A vencer"}
                    </Tag>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* ---------------- documentos ---------------- */}
      {aba === "documentos" && (
        <Documents
          patientId={patient.id}
          documents={docs.map((d) => ({
            id: d.id,
            kind: d.kind,
            title: d.title,
            createdAt: d.createdAt.toISOString(),
            authorName: d.authorName,
          }))}
          models={DOCUMENT_CATALOG.map((m) => ({
            kind: m.kind,
            label: m.label,
            description: m.description,
            fields: m.fields.map((f) => ({
              name: f.name,
              label: f.label,
              placeholder: f.placeholder,
            })),
          }))}
        />
      )}

      {/* ---------------- evoluções ---------------- */}
      {aba === "evolucoes" && (
        <Card>
          <CardTitle>Evolução clínica</CardTitle>
          <NoteComposer patientId={patient.id} />

          {notes.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<IconRecord className="h-9 w-9" />}
                title="Sem evoluções registradas"
              />
            </div>
          ) : (
            <ol className="mt-6 space-y-5">
              {notes.map((note) => (
                <li key={note.id} className="border-l-2 border-zinc-200 pl-4">
                  <p className="text-xs font-medium text-zinc-500">
                    {longDate(isoDate(note.createdAt))} · {note.dentistName}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700">{note.text}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, patients, users } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { isoDate, longDate } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Documento", robots: { index: false } };

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinic } = await requireSession();
  const { id } = await params;

  const [row] = await db
    .select({
      document: documents,
      patientName: patients.name,
      patientCpf: patients.cpf,
      patientCode: patients.code,
      authorName: users.name,
      authorCro: users.cro,
    })
    .from(documents)
    .innerJoin(patients, eq(patients.id, documents.patientId))
    .innerJoin(users, eq(users.id, documents.authorId))
    .where(and(eq(documents.clinicId, clinic.id), eq(documents.id, id)))
    .limit(1);

  if (!row) notFound();

  const { document, patientName, patientCpf, patientCode, authorName, authorCro } = row;

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <a
          href={`/sistema/pacientes/${document.patientId}?aba=documentos`}
          className="text-xs font-medium text-zinc-500 hover:text-accent"
        >
          ← Voltar para a ficha
        </a>
        <PrintButton />
      </div>

      {/* A folha. Em tela ela é um card; na impressão vira a página inteira. */}
      <article className="panel bg-white p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-zinc-200 pb-5">
          <p className="font-display text-lg font-semibold text-zinc-900">{clinic.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {[clinic.address, clinic.phone, clinic.cnpj && `CNPJ ${clinic.cnpj}`, clinic.croResponsible]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>

        <h1 className="font-display mt-8 text-center text-base font-semibold uppercase tracking-wide text-zinc-900">
          {document.title}
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-600">
          <div className="flex gap-2">
            <dt className="text-zinc-400">Paciente:</dt>
            <dd>{patientName}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400">Prontuário:</dt>
            <dd>{patientCode !== null ? String(patientCode).padStart(4, "0") : "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400">CPF:</dt>
            <dd>{patientCpf ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400">Emissão:</dt>
            <dd>{longDate(isoDate(document.createdAt))}</dd>
          </div>
        </dl>

        <div className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-zinc-900">
          {document.body}
        </div>

        <div className="mt-20 text-center">
          <div className="mx-auto w-72 border-t border-zinc-400 pt-2">
            <p className="text-sm text-zinc-900">{authorName}</p>
            <p className="text-xs text-zinc-500">
              {authorCro ?? clinic.croResponsible ?? "Cirurgião-dentista"}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

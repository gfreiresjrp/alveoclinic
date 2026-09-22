import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { procedures } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { getChairs, getTeam } from "@/lib/queries";
import { Card, CardTitle, PageHeader, Tag } from "@/components/app/ui";
import { hhmm, money } from "@/lib/format";
import { ClinicForm, ProcedureManager } from "./Forms";

export const metadata: Metadata = { title: "Configurações", robots: { index: false } };

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  reception: "Recepção",
};

export default async function ConfiguracoesPage() {
  const { clinic, user } = await requireSession();

  const [team, chairRows, procRows] = await Promise.all([
    getTeam(clinic.id),
    getChairs(clinic.id),
    db.select().from(procedures).where(eq(procedures.clinicId, clinic.id)),
  ]);

  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        subtitle={isAdmin ? "Dados da clínica, equipe e tabela de procedimentos" : "Somente leitura — peça ao administrador para alterar"}
      />

      <Card>
        <CardTitle>Dados da clínica</CardTitle>
        <ClinicForm
          disabled={!isAdmin}
          clinic={{
            name: clinic.name,
            phone: clinic.phone,
            address: clinic.address,
            cro: clinic.croResponsible,
            opening: hhmm(clinic.openingMin),
            closing: hhmm(clinic.closingMin),
            slot: clinic.slotMin,
          }}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Equipe</CardTitle>
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {team.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {member.email}
                    {member.cro && ` · ${member.cro}`}
                  </p>
                </div>
                <Tag tone={member.active ? "done" : "pending"}>{ROLE_LABEL[member.role]}</Tag>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Consultórios</CardTitle>
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {chairRows.map((chair) => (
              <div key={chair.id} className="px-4 py-3 text-sm text-slate-900">
                {chair.name}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            A Íris distribui os agendamentos entre os consultórios ativos.
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>Tabela de procedimentos</CardTitle>
        <p className="mt-1.5 text-sm text-slate-500">
          É desta tabela que a Íris tira duração e valor ao conversar com o paciente.
        </p>

        <ProcedureManager
          disabled={!isAdmin}
          procedures={procRows.map((p) => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty,
            durationMin: p.durationMin,
            price: money(p.priceCents),
            perTooth: p.perTooth,
            active: p.active,
          }))}
        />
      </Card>
    </div>
  );
}

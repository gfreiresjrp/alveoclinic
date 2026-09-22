import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { appointments, campaignSends, patients } from "@/db/schema";
import { getPatientsOverview } from "./queries";
import { addDays, isoDate, money } from "./format";

/**
 * Campanhas automáticas.
 *
 * Cada tipo sabe montar o próprio público a partir do que já está no banco —
 * não existe lista paralela de contatos. O texto é um modelo com variáveis
 * entre chaves, preenchidas na hora do envio.
 */

export type CampaignKind =
  | "birthday"
  | "recall"
  | "reactivation"
  | "overdue"
  | "satisfaction"
  | "custom";

export type Target = {
  patientId: string;
  name: string;
  phone: string;
  /** Linha curta explicando por que a pessoa entrou no público. */
  reason: string;
  /** Valores extras para o modelo da mensagem. */
  vars: Record<string, string>;
};

export const CAMPAIGN_CATALOG: {
  kind: CampaignKind;
  name: string;
  description: string;
  template: string;
  config: Record<string, number | string>;
}[] = [
  {
    kind: "birthday",
    name: "Aniversariantes",
    description: "Parabeniza quem faz aniversário hoje.",
    template:
      "Feliz aniversário, {paciente}! 🎉 A equipe da {clinica} deseja um dia muito especial para você.",
    config: {},
  },
  {
    kind: "recall",
    name: "Retorno semestral",
    description:
      "Convida quem passou pela última consulta há mais de 6 meses e não tem retorno marcado.",
    template:
      "Oi, {paciente}! Faz {meses} meses desde a sua última consulta na {clinica}. Que tal agendar uma revisão? É só responder aqui que a gente marca.",
    config: { months: 6 },
  },
  {
    kind: "reactivation",
    name: "Reativação",
    description: "Chama quem não aparece há mais de um ano.",
    template:
      "Oi, {paciente}! Sentimos sua falta na {clinica} — sua última visita foi em {ultima_visita}. Quer marcar uma avaliação?",
    config: { months: 12 },
  },
  {
    kind: "overdue",
    name: "Inadimplentes",
    description: "Lembra quem tem pagamento vencido em aberto.",
    template:
      "Oi, {paciente}! Passando para lembrar do valor de {valor} em aberto na {clinica}. Qualquer dúvida, é só responder por aqui.",
    config: {},
  },
  {
    kind: "satisfaction",
    name: "Pesquisa de satisfação",
    description: "Pede a opinião de quem foi atendido no dia anterior.",
    template:
      "Oi, {paciente}! Como foi seu atendimento na {clinica} ontem? Responda de 1 a 5 — sua opinião ajuda muito a gente.",
    config: { daysAfter: 1 },
  },
  {
    kind: "custom",
    name: "Personalizada",
    description: "Você escolhe o público e escreve a mensagem.",
    template: "Oi, {paciente}! ",
    config: { months: 0 },
  },
];

function parseConfig(raw: string | null): Record<string, number | string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number | string>;
  } catch {
    return {};
  }
}

/** Data de N meses atrás, em YYYY-MM-DD. */
function monthsAgo(today: string, months: number) {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1 - months, d);
  return isoDate(date);
}

export async function buildAudience({
  clinicId,
  clinicName,
  kind,
  config: rawConfig,
  today,
}: {
  clinicId: string;
  clinicName: string;
  kind: string;
  config: string | null;
  today: string;
}): Promise<Target[]> {
  const config = parseConfig(rawConfig);
  const rows = await getPatientsOverview(clinicId, { today });

  const base = (patient: (typeof rows)[number]) => ({
    patientId: patient.id,
    name: patient.name,
    phone: patient.phone,
    vars: {
      paciente: patient.name.split(" ")[0],
      nome_completo: patient.name,
      clinica: clinicName,
      valor: money(patient.overdueCents),
      ultima_visita: patient.lastVisit ?? "—",
    },
  });

  if (kind === "birthday") {
    return rows
      .filter((p) => p.birthDate && p.birthDate.slice(5) === today.slice(5))
      .map((p) => ({ ...base(p), reason: "faz aniversário hoje" }));
  }

  if (kind === "recall" || kind === "reactivation" || kind === "custom") {
    const months = Number(config.months ?? 6);
    const limit = monthsAgo(today, months);

    return rows
      .filter((p) => {
        if (p.nextVisit) return false;
        if (months === 0) return true;
        return p.lastVisit !== null && p.lastVisit < limit;
      })
      .map((p) => ({
        ...base(p),
        reason: p.lastVisit ? `última visita em ${p.lastVisit}` : "sem visita registrada",
        vars: { ...base(p).vars, meses: String(months) },
      }));
  }

  if (kind === "overdue") {
    return rows
      .filter((p) => p.overdueCents > 0)
      .map((p) => ({
        ...base(p),
        reason: `${money(p.overdueCents)} vencido`,
      }));
  }

  if (kind === "satisfaction") {
    const day = addDays(today, -Number(config.daysAfter ?? 1));

    const attended = await db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          eq(appointments.date, day),
          eq(appointments.status, "attended"),
        ),
      );

    const ids = new Set(attended.map((a) => a.patientId));
    return rows
      .filter((p) => ids.has(p.id))
      .map((p) => ({ ...base(p), reason: `atendido em ${day}` }));
  }

  return [];
}

/** Troca {variaveis} do modelo pelos valores do paciente. */
export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/** Quem já recebeu esta campanha hoje — para não mandar duas vezes. */
export async function alreadySentToday(campaignId: string, day: string, patientIds: string[]) {
  if (patientIds.length === 0) return new Set<string>();

  const rows = await db
    .select({ patientId: campaignSends.patientId })
    .from(campaignSends)
    .where(
      and(
        eq(campaignSends.campaignId, campaignId),
        eq(campaignSends.sentOn, day),
        inArray(campaignSends.patientId, patientIds),
      ),
    );

  return new Set(rows.map((r) => r.patientId));
}

/** Confere se o paciente ainda pertence à clínica antes de qualquer envio. */
export async function assertPatientsOfClinic(clinicId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.clinicId, clinicId), inArray(patients.id, ids)));
}

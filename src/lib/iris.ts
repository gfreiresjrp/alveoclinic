import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  clinics,
  conversations,
  irisSettings,
  messages,
  patients,
  procedures,
  users,
} from "@/db/schema";
import { newId } from "./id";
import { isoDate, longDate, money, toMinutes } from "./format";
import { findFreeSlots } from "./availability";

/**
 * O motor da Íris.
 *
 * A IA não "inventa" horário: ela só enxerga a agenda pelas ferramentas abaixo,
 * que batem no mesmo banco que a recepção usa. Quem decide marcar é ela; quem
 * valida conflito é o banco.
 */

const MODEL = "claude-sonnet-5";

export function isIrisConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const consultarHorarios: Anthropic.Tool = {
  name: "consultar_horarios",
  description:
    "Lista horários realmente livres na agenda da clínica para um procedimento. Use sempre antes de oferecer qualquer horário ao paciente.",
  input_schema: {
    type: "object",
    properties: {
      procedimento: {
        type: "string",
        description: "Nome do procedimento, exatamente como aparece na tabela da clínica.",
      },
      a_partir_de: {
        type: "string",
        description: "Data inicial da busca no formato AAAA-MM-DD. Padrão: hoje.",
      },
    },
    required: ["procedimento"],
  },
};

const agendar: Anthropic.Tool = {
  name: "agendar",
  description:
    "Marca a consulta na agenda. Só chame depois de o paciente confirmar explicitamente um horário que você ofereceu.",
  input_schema: {
    type: "object",
    properties: {
      nome_paciente: { type: "string" },
      procedimento: { type: "string" },
      data: { type: "string", description: "AAAA-MM-DD" },
      hora: { type: "string", description: "HH:MM" },
      dentista: {
        type: "string",
        description: "Nome do dentista, como retornado em consultar_horarios.",
      },
    },
    required: ["nome_paciente", "procedimento", "data", "hora", "dentista"],
  },
};

const transferir: Anthropic.Tool = {
  name: "transferir_para_humano",
  description:
    "Passa a conversa para a equipe da clínica. Use em urgência, dor intensa, reclamação, pedido explícito do paciente ou qualquer assunto clínico que exija um profissional.",
  input_schema: {
    type: "object",
    properties: {
      motivo: { type: "string" },
    },
    required: ["motivo"],
  },
};

/** Sem permissão de agendar, a ferramenta nem chega ao modelo. */
function toolsFor(canSchedule: boolean): Anthropic.Tool[] {
  return canSchedule
    ? [consultarHorarios, agendar, transferir]
    : [consultarHorarios, transferir];
}

/** Valores usados quando a clínica ainda não salvou nada. */
export type IrisTone = "acolhedor" | "direto" | "formal";

export const IRIS_DEFAULTS = {
  active: true,
  tone: "acolhedor" as IrisTone,
  greeting: null as string | null,
  canSchedule: true,
  answerOutsideHours: true,
  awayMessage: null as string | null,
  handoffKeywords: null as string | null,
  maxAiMessages: 0,
  extraInstructions: null as string | null,
};

export type IrisConfig = typeof IRIS_DEFAULTS;

export async function loadIrisSettings(clinicId: string): Promise<IrisConfig> {
  const [row] = await db
    .select()
    .from(irisSettings)
    .where(eq(irisSettings.clinicId, clinicId))
    .limit(1);
  if (!row) return IRIS_DEFAULTS;
  return {
    active: row.active,
    tone: row.tone,
    greeting: row.greeting,
    canSchedule: row.canSchedule,
    answerOutsideHours: row.answerOutsideHours,
    awayMessage: row.awayMessage,
    handoffKeywords: row.handoffKeywords,
    maxAiMessages: row.maxAiMessages,
    extraInstructions: row.extraInstructions,
  };
}

const TONE_LINE: Record<IrisTone, string> = {
  acolhedor:
    "Fale como uma recepcionista brasileira atenciosa: frases curtas, tom natural e acolhedor, sem formalidade excessiva e sem emoji em excesso (no máximo um por mensagem).",
  direto:
    "Seja objetiva: responda o que foi perguntado em uma ou duas frases, sem rodeio e sem emoji.",
  formal:
    "Use tratamento formal (senhor/senhora), frases completas e vocabulário profissional, sem emoji.",
};

/** Palavras da clínica que forçam a transferência antes mesmo de chamar o modelo. */
export function matchHandoffKeyword(text: string, keywords: string | null) {
  if (!keywords) return null;
  const alvo = text.toLowerCase();
  return (
    keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .find((k) => alvo.includes(k)) ?? null
  );
}

type Context = {
  clinicId: string;
  conversationId: string;
  phone: string;
  /** Console de teste: as ferramentas que escrevem só relatam o que fariam. */
  preview?: boolean;
};

async function loadClinicContext(clinicId: string) {
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
  const [procs, dentists] = await Promise.all([
    db
      .select()
      .from(procedures)
      .where(and(eq(procedures.clinicId, clinicId), eq(procedures.active, true)))
      .orderBy(asc(procedures.name)),
    db
      .select()
      .from(users)
      .where(and(eq(users.clinicId, clinicId), eq(users.role, "dentist"), eq(users.active, true))),
  ]);
  return { clinic, procs, dentists };
}

export function systemPrompt(
  clinicName: string,
  address: string | null,
  procs: { name: string; priceCents: number; durationMin: number }[],
  today: string,
  cfg: IrisConfig,
) {
  const table = procs
    .map((p) => `- ${p.name}: ${money(p.priceCents)} · ${p.durationMin} min`)
    .join("\n");

  return `Você é a Íris, assistente virtual da ${clinicName}, uma clínica odontológica. Você atende pacientes pelo WhatsApp.

Hoje é ${longDate(today)} (${today}).
${address ? `Endereço da clínica: ${address}.` : ""}

Tabela de procedimentos:
${table}

Como você trabalha:
- ${TONE_LINE[cfg.tone]}
- Na primeira mensagem da conversa, identifique-se como assistente virtual${cfg.greeting ? ` usando esta apresentação: "${cfg.greeting}"` : ""}. Nunca finja ser humana nem um profissional de saúde.
- Nunca dê diagnóstico, conduta, prescrição ou opinião clínica. Se o paciente descrever sintomas, acolha e conduza para a avaliação presencial.
- Nunca prometa resultado de tratamento e nunca feche orçamento de tratamento pelo WhatsApp: o valor depende de exame clínico. Você pode informar o valor da avaliação e os valores da tabela acima.
${
    cfg.canSchedule
      ? `- Nunca ofereça um horário sem antes chamar consultar_horarios. Jamais invente disponibilidade.
- Só chame agendar depois que o paciente confirmar com clareza um horário específico.`
      : `- Você NÃO marca consulta. Pode consultar e informar horários livres, mas quem confirma é a equipe: quando o paciente quiser fechar um horário, chame transferir_para_humano.`
  }
- Dor intensa, inchaço, sangramento, trauma, urgência, reclamação ou pedido para falar com alguém: chame transferir_para_humano imediatamente.
- Responda sempre em português do Brasil e mantenha as mensagens curtas, como se fosse uma conversa real de WhatsApp.${
    cfg.extraInstructions ? `\n\nInstruções específicas desta clínica:\n${cfg.extraInstructions}` : ""
  }`;
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: Context,
): Promise<string> {
  const { clinic, procs, dentists } = await loadClinicContext(ctx.clinicId);
  if (!clinic) return "Erro: clínica não encontrada.";

  const today = isoDate(new Date());

  if (name === "consultar_horarios") {
    const wanted = String(input.procedimento ?? "").toLowerCase();
    const proc =
      procs.find((p) => p.name.toLowerCase() === wanted) ??
      procs.find((p) => p.name.toLowerCase().includes(wanted)) ??
      null;

    const slots = await findFreeSlots({
      clinicId: ctx.clinicId,
      opening: clinic.openingMin,
      closing: clinic.closingMin,
      slot: clinic.slotMin,
      durationMin: proc?.durationMin ?? 30,
      dentists: dentists.map((d) => ({ id: d.id, name: d.name })),
      fromDate: String(input.a_partir_de ?? today),
    });

    if (slots.length === 0) return "Nenhum horário livre nos próximos dias.";

    return slots
      .map((s) => `${s.date} às ${s.time} com ${s.dentistName}`)
      .join("\n");
  }

  if (name === "agendar") {
    if (ctx.preview) {
      return `Simulação: aqui a consulta seria marcada (${String(input.data ?? "")} às ${String(
        input.hora ?? "",
      )}). No teste nada é gravado na agenda.`;
    }
    const date = String(input.data ?? "");
    const time = String(input.hora ?? "");
    const dentistName = String(input.dentista ?? "");
    const patientName = String(input.nome_paciente ?? "").trim();

    const dentist =
      dentists.find((d) => d.name === dentistName) ??
      dentists.find((d) => d.name.toLowerCase().includes(dentistName.toLowerCase()));
    if (!dentist) return "Erro: dentista não encontrado. Consulte os horários de novo.";

    const wanted = String(input.procedimento ?? "").toLowerCase();
    const proc =
      procs.find((p) => p.name.toLowerCase() === wanted) ??
      procs.find((p) => p.name.toLowerCase().includes(wanted)) ??
      null;

    const startMin = toMinutes(time);
    const endMin = startMin + (proc?.durationMin ?? 30);

    // Checagem final de conflito — entre a consulta e a confirmação do
    // paciente, a recepção pode ter marcado alguém nesse horário.
    const sameDay = await db
      .select({ startMin: appointments.startMin, endMin: appointments.endMin })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, ctx.clinicId),
          eq(appointments.dentistId, dentist.id),
          eq(appointments.date, date),
        ),
      );
    if (sameDay.some((a) => startMin < a.endMin && endMin > a.startMin)) {
      return "Esse horário acabou de ser ocupado. Consulte os horários novamente e ofereça outro.";
    }

    // Reaproveita o cadastro pelo telefone; só cria um novo quando não existe.
    const [existing] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.clinicId, ctx.clinicId), eq(patients.phone, ctx.phone)))
      .limit(1);

    let patientId = existing?.id;
    if (!patientId) {
      patientId = newId("pat_");
      await db.insert(patients).values({
        id: patientId,
        clinicId: ctx.clinicId,
        name: patientName || "Paciente do WhatsApp",
        phone: ctx.phone,
      });
    }

    await db.insert(appointments).values({
      id: newId("apt_"),
      clinicId: ctx.clinicId,
      patientId,
      dentistId: dentist.id,
      chairId: null,
      procedureId: proc?.id ?? null,
      date,
      startMin,
      endMin,
      status: "scheduled",
      source: "ai",
      notes: "Agendado pela Íris no WhatsApp",
    });

    await db
      .update(conversations)
      .set({ patientId })
      .where(eq(conversations.id, ctx.conversationId));

    return `Agendado: ${date} às ${time} com ${dentist.name}.`;
  }

  if (name === "transferir_para_humano") {
    if (ctx.preview) {
      return `Simulação: a conversa seria passada para a equipe. Motivo: ${String(
        input.motivo ?? "",
      )}.`;
    }
    await db
      .update(conversations)
      .set({ status: "human", handoffReason: String(input.motivo ?? "Transferido pela Íris") })
      .where(eq(conversations.id, ctx.conversationId));

    return "Conversa transferida para a equipe. Avise o paciente que alguém vai responder em instantes e pare de conduzir o atendimento.";
  }

  return "Ferramenta desconhecida.";
}

const HANDOFF_REPLY =
  "Vou chamar alguém da equipe para te ajudar com isso. Só um instante, por favor.";

async function handOff(conversationId: string, reason: string) {
  await db
    .update(conversations)
    .set({ status: "human", handoffReason: reason })
    .where(eq(conversations.id, conversationId));
}

async function saveAiMessage(conversationId: string, text: string) {
  await db.insert(messages).values({
    id: newId("msg_"),
    conversationId,
    role: "ai",
    text,
  });
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
  return text;
}

/**
 * Processa a mensagem recebida e devolve a resposta da Íris (ou null quando a
 * conversa está com a equipe e a IA não deve responder).
 */
export async function replyAsIris(ctx: Context): Promise<string | null> {
  if (!isIrisConfigured()) return null;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, ctx.conversationId))
    .limit(1);
  if (!conversation || conversation.status !== "ai") return null;

  const { clinic, procs } = await loadClinicContext(ctx.clinicId);
  if (!clinic) return null;

  const cfg = await loadIrisSettings(ctx.clinicId);

  // Desligada: a conversa vai direto para a equipe, sem gastar chamada de IA.
  if (!cfg.active) {
    await handOff(ctx.conversationId, "Íris desligada nas configurações");
    return null;
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, ctx.conversationId))
    .orderBy(asc(messages.createdAt));

  const lastPatient = [...history].reverse().find((m) => m.role === "patient");

  // Palavra-chave da clínica: transfere antes de chamar o modelo.
  const hit = matchHandoffKeyword(lastPatient?.text ?? "", cfg.handoffKeywords);
  if (hit) {
    await handOff(ctx.conversationId, `Palavra-chave "${hit}" na mensagem do paciente`);
    return saveAiMessage(ctx.conversationId, HANDOFF_REPLY);
  }

  // Limite de respostas: depois de N idas e vindas, quem assume é a equipe.
  if (cfg.maxAiMessages > 0 && history.filter((m) => m.role === "ai").length >= cfg.maxAiMessages) {
    await handOff(ctx.conversationId, `Limite de ${cfg.maxAiMessages} respostas da Íris atingido`);
    return saveAiMessage(ctx.conversationId, HANDOFF_REPLY);
  }

  // Fora do horário da clínica, quando configurado para só avisar.
  if (!cfg.answerOutsideHours) {
    const agora = new Date();
    const minutos = agora.getHours() * 60 + agora.getMinutes();
    if (minutos < clinic.openingMin || minutos >= clinic.closingMin) {
      return saveAiMessage(
        ctx.conversationId,
        cfg.awayMessage ?? "Recebemos sua mensagem! Nosso atendimento responde no horário comercial.",
      );
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const conversation_: Anthropic.MessageParam[] = history.slice(-20).map((m) => ({
    role: m.role === "patient" ? "user" : "assistant",
    content: m.text,
  }));

  let reply = "";

  // Loop de ferramentas: a IA consulta a agenda, recebe o resultado e só
  // então formula a resposta para o paciente.
  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: systemPrompt(clinic.name, clinic.address, procs, isoDate(new Date()), cfg),
      tools: toolsFor(cfg.canSchedule),
      messages: conversation_,
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (text) reply = text;

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) break;

    conversation_.push({ role: "assistant", content: response.content });
    conversation_.push({
      role: "user",
      content: await Promise.all(
        toolUses.map(async (use) => ({
          type: "tool_result" as const,
          tool_use_id: use.id,
          content: await runTool(use.name, use.input as Record<string, unknown>, ctx),
        })),
      ),
    });
  }

  if (!reply) return null;

  await db.insert(messages).values({
    id: newId("msg_"),
    conversationId: ctx.conversationId,
    role: "ai",
    text: reply,
  });

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, ctx.conversationId));

  return reply;
}

/**
 * Console de teste da aba da Íris: roda exatamente o mesmo prompt e as mesmas
 * ferramentas, mas sem tocar no banco — `agendar` e `transferir_para_humano`
 * só relatam o que fariam, e nada é gravado em `messages`. Serve para a
 * clínica conferir o efeito de uma mudança de configuração antes de salvar.
 */
export async function previewIris(
  clinicId: string,
  history: { role: "patient" | "ai"; text: string }[],
  cfg: IrisConfig,
): Promise<{ reply: string; tools: string[] }> {
  if (!isIrisConfigured()) {
    return { reply: "", tools: [] };
  }

  const { clinic, procs } = await loadClinicContext(clinicId);
  if (!clinic) return { reply: "", tools: [] };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const ctx: Context = {
    clinicId,
    conversationId: "preview",
    phone: "preview",
    preview: true,
  };

  const chat: Anthropic.MessageParam[] = history.slice(-20).map((m) => ({
    role: m.role === "patient" ? "user" : "assistant",
    content: m.text,
  }));

  const usadas: string[] = [];
  let reply = "";

  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: systemPrompt(clinic.name, clinic.address, procs, isoDate(new Date()), cfg),
      tools: toolsFor(cfg.canSchedule),
      messages: chat,
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (text) reply = text;

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (toolUses.length === 0) break;

    for (const use of toolUses) usadas.push(use.name);

    chat.push({ role: "assistant", content: response.content });
    chat.push({
      role: "user",
      content: await Promise.all(
        toolUses.map(async (use) => ({
          type: "tool_result" as const,
          tool_use_id: use.id,
          content: await runTool(use.name, use.input as Record<string, unknown>, ctx),
        })),
      ),
    });
  }

  return { reply, tools: usadas };
}

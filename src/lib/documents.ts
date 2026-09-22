import "server-only";
import { longDate, money } from "./format";

/**
 * Modelos de documento.
 *
 * Cada tipo sabe montar um rascunho a partir dos dados da clínica e do
 * paciente. O texto sai editável: o profissional ajusta antes de salvar, e o
 * que ficou salvo é exatamente o que será impresso.
 */

export type DocumentKind =
  | "recibo"
  | "atestado"
  | "encaminhamento"
  | "receita"
  | "exame"
  | "contrato";

export const DOCUMENT_CATALOG: {
  kind: DocumentKind;
  label: string;
  title: string;
  description: string;
  /** Campos extras pedidos antes de gerar o rascunho. */
  fields: { name: string; label: string; placeholder?: string; type?: "text" | "number" }[];
}[] = [
  {
    kind: "recibo",
    label: "Recibo",
    title: "Recibo de pagamento",
    description: "Comprovante de valor recebido, com dados da clínica e do paciente.",
    fields: [
      { name: "valor", label: "Valor recebido (R$)", placeholder: "280,00" },
      { name: "referente", label: "Referente a", placeholder: "Tratamento de canal no dente 26" },
    ],
  },
  {
    kind: "atestado",
    label: "Atestado",
    title: "Atestado odontológico",
    description: "Comprova o comparecimento e o afastamento, quando houver.",
    fields: [
      { name: "horas", label: "Período de afastamento", placeholder: "2 horas / 1 dia" },
      { name: "procedimento", label: "Procedimento realizado", placeholder: "Exodontia do 38" },
    ],
  },
  {
    kind: "encaminhamento",
    label: "Encaminhamento",
    title: "Encaminhamento profissional",
    description: "Envia o paciente a outro profissional ou especialidade.",
    fields: [
      { name: "especialidade", label: "Especialidade", placeholder: "Endodontia" },
      { name: "motivo", label: "Motivo", placeholder: "Necrose pulpar no 46" },
    ],
  },
  {
    kind: "receita",
    label: "Receituário",
    title: "Receituário odontológico",
    description: "Prescrição de medicamentos, uma linha por item.",
    fields: [
      {
        name: "prescricao",
        label: "Prescrição",
        placeholder: "Amoxicilina 500mg — 1 cápsula de 8/8h por 7 dias",
      },
    ],
  },
  {
    kind: "exame",
    label: "Pedido de exame",
    title: "Solicitação de exame",
    description: "Raio-x, documentação ortodôntica e outros exames.",
    fields: [
      { name: "exame", label: "Exame solicitado", placeholder: "Radiografia periapical do 46" },
      { name: "justificativa", label: "Indicação clínica", placeholder: "Avaliação endodôntica" },
    ],
  },
  {
    kind: "contrato",
    label: "Contrato",
    title: "Contrato de prestação de serviços odontológicos",
    description: "Formaliza o tratamento aprovado e as condições de pagamento.",
    fields: [
      { name: "tratamento", label: "Tratamento", placeholder: "Reabilitação estética" },
      { name: "valor", label: "Valor total (R$)", placeholder: "1.840,00" },
      { name: "condicoes", label: "Condições de pagamento", placeholder: "4x no cartão" },
    ],
  },
];

type Context = {
  clinicName: string;
  clinicCnpj: string | null;
  clinicAddress: string | null;
  cro: string | null;
  patientName: string;
  patientCpf: string | null;
  authorName: string;
  authorCro: string | null;
  today: string;
};

/**
 * "São Paulo, 22 de setembro de 2026." — a linha de data que todo documento
 * leva. A cidade sai do endereço da clínica: pedaço depois do último hífen,
 * antes da UF, e só o trecho após a última vírgula (que descarta o bairro).
 */
function assinaturaLegal({ clinicAddress, today }: Context) {
  const semUf = clinicAddress?.split("—").pop()?.split("/")[0] ?? "";
  const cidade = semUf.split(",").pop()?.trim() ?? "";
  return `${cidade ? `${cidade}, ` : ""}${longDate(today)}.`;
}

/** Monta o rascunho do documento. Tudo aqui é editável depois. */
export function renderDocument(
  kind: DocumentKind,
  values: Record<string, string>,
  ctx: Context,
): string {
  const paciente = ctx.patientCpf
    ? `${ctx.patientName}, inscrito(a) no CPF ${ctx.patientCpf}`
    : ctx.patientName;

  const profissional = ctx.authorCro
    ? `${ctx.authorName} — ${ctx.authorCro}`
    : ctx.authorName;

  const data = assinaturaLegal(ctx);

  if (kind === "recibo") {
    const valor = values.valor ?? "0,00";
    const cents = Math.round(Number(valor.replace(/\./g, "").replace(",", ".")) * 100);
    const extenso = Number.isFinite(cents) ? money(cents) : `R$ ${valor}`;

    return [
      `Recebi de ${paciente} a importância de ${extenso}, referente a ${values.referente ?? "serviços odontológicos"}.`,
      "",
      `Para clareza firmo o presente recibo.`,
      "",
      data,
    ].join("\n");
  }

  if (kind === "atestado") {
    return [
      `Atesto para os devidos fins que ${paciente} esteve sob atendimento odontológico nesta data${
        values.procedimento ? `, para ${values.procedimento}` : ""
      }.`,
      "",
      values.horas
        ? `Recomenda-se afastamento de suas atividades pelo período de ${values.horas}.`
        : "",
      "",
      data,
    ]
      .filter((linha, i, todas) => linha !== "" || todas[i - 1] !== "")
      .join("\n");
  }

  if (kind === "encaminhamento") {
    return [
      `Encaminho o(a) paciente ${paciente} para avaliação e conduta em ${values.especialidade ?? "especialidade"}.`,
      "",
      values.motivo ? `Motivo: ${values.motivo}.` : "",
      "",
      "Coloco-me à disposição para as informações complementares que forem necessárias.",
      "",
      data,
    ]
      .filter((linha, i, todas) => linha !== "" || todas[i - 1] !== "")
      .join("\n");
  }

  if (kind === "receita") {
    return [
      `Paciente: ${paciente}`,
      "",
      "Uso oral:",
      ...(values.prescricao ?? "").split("\n").map((linha) => `• ${linha}`),
      "",
      data,
    ].join("\n");
  }

  if (kind === "exame") {
    return [
      `Solicito para o(a) paciente ${paciente}:`,
      "",
      `• ${values.exame ?? "exame"}`,
      "",
      values.justificativa ? `Indicação clínica: ${values.justificativa}.` : "",
      "",
      data,
    ]
      .filter((linha, i, todas) => linha !== "" || todas[i - 1] !== "")
      .join("\n");
  }

  // contrato
  return [
    `CONTRATANTE: ${paciente}.`,
    `CONTRATADA: ${ctx.clinicName}${ctx.clinicCnpj ? `, CNPJ ${ctx.clinicCnpj}` : ""}${
      ctx.cro ? `, responsável técnico ${ctx.cro}` : ""
    }.`,
    "",
    `1. OBJETO — A contratada prestará ao contratante o tratamento odontológico de ${values.tratamento ?? "—"}, conforme plano apresentado e aceito.`,
    "",
    `2. VALOR — O valor total dos serviços é de R$ ${values.valor ?? "0,00"}, a ser pago da seguinte forma: ${values.condicoes ?? "a combinar"}.`,
    "",
    "3. OBRIGAÇÕES DO CONTRATANTE — Comparecer às consultas marcadas, seguir as orientações recebidas e comunicar qualquer intercorrência.",
    "",
    "4. RESULTADO — O tratamento odontológico é obrigação de meio, não de resultado, sendo a conduta pautada pela técnica e pela ética profissional.",
    "",
    `5. RESCISÃO — O contrato pode ser encerrado por qualquer das partes, apurando-se os serviços já executados.`,
    "",
    data,
    "",
    `Profissional responsável: ${profissional}`,
  ].join("\n");
}

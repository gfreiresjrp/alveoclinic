/**
 * Popula o banco com uma clínica de demonstração.
 * Roda com `npm run db:seed` e é idempotente: limpa e recria tudo.
 */
import { db } from "../src/db";
import {
  appointments,
  campaignSends,
  documents,
  campaigns,
  chairs,
  patientReminders,
  payments,
  clinicalNotes,
  clinics,
  conversations,
  financeEntries,
  messages,
  patients,
  procedures,
  irisSettings,
  labCases,
  stockItems,
  stockMoves,
  toothRecords,
  treatmentItems,
  treatmentPlans,
  users,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { newId } from "../src/lib/id";
import { addDays, isoDate, startOfWeek } from "../src/lib/format";

const CLINIC_ID = "clinic_demo";
const today = isoDate(new Date());
const monday = startOfWeek(today);

async function main() {
  // Ordem inversa das dependências. No Postgres as foreign keys são
  // sempre verificadas, então a ordem aqui não é zelo: é obrigação.
  await db.delete(campaignSends);
  await db.delete(campaigns);
  await db.delete(payments);
  await db.delete(patientReminders);
  await db.delete(documents);
  await db.delete(irisSettings);
  await db.delete(stockMoves);
  await db.delete(stockItems);
  await db.delete(labCases);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(financeEntries);
  await db.delete(treatmentItems);
  await db.delete(treatmentPlans);
  await db.delete(clinicalNotes);
  await db.delete(toothRecords);
  await db.delete(appointments);
  await db.delete(patients);
  await db.delete(procedures);
  await db.delete(chairs);
  await db.delete(users);
  await db.delete(clinics);

  await db.insert(clinics).values({
    id: CLINIC_ID,
    name: "Clínica Sorriso Vivo",
    cnpj: "12.345.678/0001-90",
    phone: "(11) 4002-8922",
    address: "Rua das Acácias, 120 — Pinheiros, São Paulo/SP",
    croResponsible: "CRO-SP 45.821",
    openingMin: 8 * 60,
    closingMin: 19 * 60,
    slotMin: 30,
  });

  const pass = await hashPassword("alveo123");
  const team = [
    { id: "user_admin", name: "Gabriel Freire", email: "admin@sorrisovivo.com.br", role: "admin" as const, cro: null, specialty: "Gestão", color: "#0b1d3a" },
    { id: "user_helena", name: "Dra. Helena Marques", email: "helena@sorrisovivo.com.br", role: "dentist" as const, cro: "CRO-SP 45.821", specialty: "Clínica geral e estética", color: "#2563eb" },
    { id: "user_rafael", name: "Dr. Rafael Nunes", email: "rafael@sorrisovivo.com.br", role: "dentist" as const, cro: "CRO-SP 52.114", specialty: "Implantodontia", color: "#7c3aed" },
    { id: "user_recep", name: "Bianca Souza", email: "recepcao@sorrisovivo.com.br", role: "reception" as const, cro: null, specialty: null, color: "#64748b" },
  ];
  await db.insert(users).values(
    team.map((u) => ({ ...u, clinicId: CLINIC_ID, passwordHash: pass, active: true })),
  );

  const chairRows = ["Consultório 1", "Consultório 2", "Consultório 3"].map((name, i) => ({
    id: `chair_${i + 1}`,
    clinicId: CLINIC_ID,
    name,
    active: true,
  }));
  await db.insert(chairs).values(chairRows);

  const procList = [
    ["Avaliação e diagnóstico", "Clínica geral", 30, 12000, false],
    ["Profilaxia (limpeza)", "Clínica geral", 40, 18000, false],
    ["Restauração em resina", "Dentística", 50, 28000, true],
    ["Extração simples", "Cirurgia", 40, 32000, true],
    ["Extração de siso", "Cirurgia", 70, 85000, true],
    ["Tratamento de canal", "Endodontia", 90, 95000, true],
    ["Clareamento a laser", "Estética", 60, 120000, false],
    ["Clareamento caseiro", "Estética", 30, 85000, false],
    ["Faceta em resina", "Estética", 80, 95000, true],
    ["Coroa de porcelana", "Prótese", 70, 180000, true],
    ["Implante unitário", "Implantodontia", 90, 350000, true],
    ["Manutenção de aparelho", "Ortodontia", 30, 18000, false],
    ["Instalação de aparelho fixo", "Ortodontia", 80, 150000, false],
    ["Raspagem periodontal", "Periodontia", 60, 45000, false],
    ["Aplicação de flúor", "Odontopediatria", 20, 9000, false],
    ["Urgência — dor", "Clínica geral", 30, 15000, false],
  ] as const;

  const procRows = procList.map(([name, specialty, durationMin, priceCents, perTooth], i) => ({
    id: `proc_${i + 1}`,
    clinicId: CLINIC_ID,
    name,
    specialty,
    code: null,
    durationMin,
    priceCents,
    perTooth,
    active: true,
  }));
  await db.insert(procedures).values(procRows);

  const patientList = [
    ["Mariana Alves", "(11) 98812-4477", "1991-04-12", "Unimed"],
    ["Carlos Eduardo Lima", "(11) 99654-1120", "1978-11-03", null],
    ["Juliana Prado", "(11) 97733-8890", "1995-07-25", "Amil Dental"],
    ["Roberto Tanaka", "(11) 98123-5567", "1965-02-18", null],
    ["Fernanda Castro", "(11) 99012-3345", "1988-09-30", "Unimed"],
    ["Paulo Henrique Dias", "(11) 98456-7781", "2001-12-09", null],
    ["Aline Ribeiro", "(11) 97211-6654", "1993-05-14", "Porto Seguro"],
    ["Marcos Vinícius Rocha", "(11) 99887-2210", "1984-08-21", null],
    ["Beatriz Nogueira", "(11) 98345-9912", "2016-03-07", "Amil Dental"],
    ["Sandra Meireles", "(11) 97654-3301", "1959-10-11", null],
    ["Thiago Barbosa", "(11) 99321-7788", "1999-01-27", null],
    ["Letícia Ramos", "(11) 98770-5523", "1990-06-02", "Unimed"],
  ] as const;

  const CANAIS = [
    "Indicação de paciente",
    "Instagram",
    "Google",
    "Placa / fachada",
    "Convênio",
    "Facebook",
  ];

  const patientRows = patientList.map(([name, phone, birthDate, insurance], i) => ({
    id: `pat_${i + 1}`,
    clinicId: CLINIC_ID,
    code: i + 1,
    source: CANAIS[i % CANAIS.length],
    name,
    phone,
    email: null,
    cpf: null,
    birthDate,
    address: null,
    insurance,
    healthNotes:
      i === 3 ? "Hipertenso, usa losartana. Alergia a dipirona." : i === 9 ? "Diabética tipo 2." : null,
    notes: null,
  }));
  await db.insert(patients).values(patientRows);

  // ---- agenda da semana ----
  type Slot = [day: number, start: number, patient: number, proc: number, dentist: string, chair: number, status: string, source: string];
  const slots: Slot[] = [
    [0, 8 * 60, 1, 2, "user_helena", 1, "attended", "staff"],
    [0, 9 * 60, 2, 3, "user_helena", 1, "attended", "ai"],
    [0, 10 * 60, 4, 11, "user_rafael", 2, "attended", "staff"],
    [0, 14 * 60, 3, 7, "user_helena", 1, "attended", "ai"],
    [0, 15 * 60 + 30, 8, 6, "user_rafael", 2, "noshow", "online"],
    [1, 8 * 60 + 30, 5, 1, "user_helena", 1, "attended", "ai"],
    [1, 9 * 60 + 30, 6, 5, "user_rafael", 2, "attended", "staff"],
    [1, 11 * 60, 9, 15, "user_helena", 3, "attended", "staff"],
    [1, 14 * 60, 7, 14, "user_helena", 1, "attended", "ai"],
    [2, 8 * 60, 10, 4, "user_rafael", 2, "confirmed", "staff"],
    [2, 9 * 60, 11, 12, "user_helena", 1, "confirmed", "ai"],
    [2, 10 * 60, 12, 2, "user_helena", 1, "scheduled", "ai"],
    [2, 14 * 60, 1, 3, "user_helena", 1, "scheduled", "staff"],
    [2, 15 * 60, 4, 11, "user_rafael", 2, "scheduled", "staff"],
    [3, 8 * 60 + 30, 3, 9, "user_helena", 1, "scheduled", "ai"],
    [3, 10 * 60, 5, 10, "user_rafael", 2, "scheduled", "staff"],
    [3, 11 * 60, 8, 16, "user_helena", 3, "scheduled", "ai"],
    [3, 14 * 60 + 30, 2, 6, "user_helena", 1, "scheduled", "staff"],
    [4, 8 * 60, 6, 13, "user_helena", 1, "scheduled", "online"],
    [4, 9 * 60 + 30, 7, 2, "user_helena", 1, "scheduled", "ai"],
    [4, 11 * 60, 12, 1, "user_rafael", 2, "scheduled", "ai"],
    [4, 14 * 60, 10, 14, "user_helena", 1, "scheduled", "staff"],
    [5, 9 * 60, 11, 7, "user_helena", 1, "scheduled", "ai"],
    [5, 10 * 60 + 30, 9, 15, "user_helena", 3, "scheduled", "staff"],
  ];

  await db.insert(appointments).values(
    slots.map(([day, start, patient, proc, dentist, chair, status, source]) => {
      const procedure = procRows[proc - 1];
      return {
        id: newId("apt_"),
        clinicId: CLINIC_ID,
        patientId: `pat_${patient}`,
        dentistId: dentist,
        chairId: `chair_${chair}`,
        procedureId: procedure.id,
        date: addDays(monday, day),
        startMin: start,
        endMin: start + procedure.durationMin,
        status: status as never,
        source: source as never,
        notes: null,
      };
    }),
  );

  // ---- odontograma da Mariana (pat_1) ----
  const teeth = [
    [16, "O", "restored"],
    [26, "M", "caries"],
    [36, null, "root_canal"],
    [46, null, "crown"],
    [18, null, "extracted"],
    [28, null, "absent"],
    [11, "V", "caries"],
  ] as const;
  await db.insert(toothRecords).values(
    teeth.map(([tooth, face, condition]) => ({
      id: newId("th_"),
      clinicId: CLINIC_ID,
      patientId: "pat_1",
      tooth,
      face,
      condition: condition as never,
      note: null,
    })),
  );

  // ---- plano de tratamento ----
  await db.insert(treatmentPlans).values({
    id: "plan_1",
    clinicId: CLINIC_ID,
    patientId: "pat_1",
    dentistId: "user_helena",
    title: "Reabilitação estética e restauradora",
    status: "accepted",
    discountCents: 10000,
    notes: "Paciente optou por dividir em 4x no cartão.",
  });
  await db.insert(treatmentItems).values([
    { id: newId("ti_"), planId: "plan_1", procedureId: "proc_3", tooth: 26, faces: "M", priceCents: 28000, status: "pending" },
    { id: newId("ti_"), planId: "plan_1", procedureId: "proc_3", tooth: 11, faces: "V", priceCents: 28000, status: "done", doneAt: new Date() },
    { id: newId("ti_"), planId: "plan_1", procedureId: "proc_7", tooth: null, faces: null, priceCents: 120000, status: "pending" },
    { id: newId("ti_"), planId: "plan_1", procedureId: "proc_2", tooth: null, faces: null, priceCents: 18000, status: "done", doneAt: new Date() },
  ]);

  await db.insert(clinicalNotes).values([
    {
      id: newId("cn_"),
      clinicId: CLINIC_ID,
      patientId: "pat_1",
      appointmentId: null,
      dentistId: "user_helena",
      text: "Profilaxia realizada. Orientação de higiene e uso de fio dental. Paciente relata sensibilidade no 26 ao frio; cárie oclusomesial confirmada em exame clínico. Plano de tratamento apresentado e aceito.",
    },
    {
      id: newId("cn_"),
      clinicId: CLINIC_ID,
      patientId: "pat_1",
      appointmentId: null,
      dentistId: "user_helena",
      text: "Restauração em resina no 11 face vestibular. Isolamento absoluto, anestesia infiltrativa com lidocaína 2%. Sem intercorrências.",
    },
  ]);

  // ---- financeiro ----
  const finance = [
    ["Restauração 11 — Mariana Alves", 28000, addDays(today, -12), addDays(today, -12), "pix", "pat_1"],
    ["Profilaxia — Mariana Alves", 18000, addDays(today, -12), addDays(today, -12), "credit", "pat_1"],
    ["Clareamento a laser — parcela 1/4", 30000, addDays(today, -2), addDays(today, -2), "credit", "pat_1"],
    ["Clareamento a laser — parcela 2/4", 30000, addDays(today, 28), null, null, "pat_1"],
    ["Implante unitário — Roberto Tanaka", 350000, addDays(today, -5), addDays(today, -5), "transfer", "pat_4"],
    ["Extração de siso — Paulo Henrique", 85000, addDays(today, -3), null, null, "pat_6"],
    ["Instalação de aparelho — Aline Ribeiro", 150000, addDays(today, -20), addDays(today, -20), "pix", "pat_7"],
    ["Manutenção de aparelho — Letícia Ramos", 18000, addDays(today, 3), null, null, "pat_12"],
    ["Tratamento de canal — Marcos Vinícius", 95000, addDays(today, -8), null, null, "pat_8"],
    ["Coroa de porcelana — Fernanda Castro", 180000, addDays(today, 6), null, null, "pat_5"],
  ] as const;

  const expenses = [
    ["Aluguel da sala", 780000, addDays(today, 4)],
    ["Materiais — fornecedor Dental Cremer", 236000, addDays(today, -6)],
    ["Laboratório de prótese", 145000, addDays(today, 9)],
    ["Folha da equipe", 1240000, addDays(today, 4)],
  ] as const;

  await db.insert(financeEntries).values([
    ...finance.map(([description, amountCents, dueDate, paidAt, method, patientId]) => ({
      id: newId("fin_"),
      clinicId: CLINIC_ID,
      patientId,
      planId: null,
      type: "income" as const,
      description,
      amountCents,
      // Lançamento quitado nasce com o valor todo recebido.
      paidCents: paidAt ? amountCents : 0,
      dueDate,
      paidAt,
      method: method as never,
      installment: null,
      installments: null,
    })),
    ...expenses.map(([description, amountCents, dueDate]) => ({
      id: newId("fin_"),
      clinicId: CLINIC_ID,
      patientId: null,
      planId: null,
      type: "expense" as const,
      description,
      amountCents,
      dueDate,
      paidAt: null,
      method: null,
      installment: null,
      installments: null,
    })),
  ]);

  await db.insert(patientReminders).values([
    {
      id: newId("rem_"),
      clinicId: CLINIC_ID,
      patientId: "pat_8",
      dueDate: addDays(today, -1),
      note: "Ligar sobre o canal do 26 — disse que o cartão vira hoje.",
      done: false,
    },
    {
      id: newId("rem_"),
      clinicId: CLINIC_ID,
      patientId: "pat_6",
      dueDate: addDays(today, 5),
      note: "Confirmar retorno da extração de siso.",
      done: false,
    },
  ]);

  // ---- conversas da Íris ----
  const convs = [
    {
      id: "conv_1",
      patientId: "pat_12",
      phone: "5511987705523",
      contactName: "Letícia Ramos",
      status: "ai" as const,
      handoffReason: null,
      msgs: [
        ["patient", "Oi, preciso remarcar minha manutenção"],
        ["ai", "Oi, Letícia! Claro. Sua manutenção está marcada para quarta às 14h. Prefere outro dia desta semana?"],
        ["patient", "Pode ser sexta de manhã"],
        ["ai", "Tenho sexta às 9h30 com a Dra. Helena. Confirmo para você?"],
        ["patient", "Confirma sim"],
        ["ai", "Remarcado! Sexta, 9h30, com a Dra. Helena. Te lembro na véspera 💚"],
      ],
    },
    {
      id: "conv_2",
      patientId: null,
      phone: "5511991234567",
      contactName: "Novo contato",
      status: "human" as const,
      handoffReason: "Urgência — dor",
      msgs: [
        ["patient", "boa noite, to com muita dor no dente do siso, ta inchado"],
        ["ai", "Sinto muito, vou te ajudar agora. Sou a Íris, assistente virtual da Sorriso Vivo. Desde quando a dor começou?"],
        ["patient", "desde ontem, não consigo dormir"],
        ["ai", "Entendi. Como há dor intensa e inchaço, vou passar você para a nossa equipe agora para encaixe de urgência."],
        ["staff", "Oi! Aqui é a Bianca. Consigo te encaixar amanhã às 8h com o Dr. Rafael. Serve?"],
      ],
    },
    {
      id: "conv_3",
      patientId: null,
      phone: "5511984449090",
      contactName: "Camila",
      status: "ai" as const,
      handoffReason: null,
      msgs: [
        ["patient", "vcs fazem clareamento? qual valor"],
        ["ai", "Fazemos sim, Camila! Trabalhamos com clareamento a laser e caseiro. O valor exato depende da avaliação, que custa R$ 120 e já sai com o plano de tratamento. Quer que eu veja um horário?"],
        ["patient", "quero, sábado de manhã tem?"],
        ["ai", "Tenho sábado às 9h com a Dra. Helena. Posso confirmar?"],
      ],
    },
  ];

  for (const c of convs) {
    await db.insert(conversations).values({
      id: c.id,
      clinicId: CLINIC_ID,
      patientId: c.patientId,
      phone: c.phone,
      contactName: c.contactName,
      status: c.status,
      handoffReason: c.handoffReason,
      lastMessageAt: new Date(),
    });
    const base = Date.now() - c.msgs.length * 4 * 60 * 1000;
    await db.insert(messages).values(
      c.msgs.map(([role, text], i) => ({
        id: newId("msg_"),
        conversationId: c.id,
        role: role as never,
        text,
        createdAt: new Date(base + i * 4 * 60 * 1000),
      })),
    );
  }

  await db.insert(irisSettings).values({
    clinicId: CLINIC_ID,
    active: true,
    tone: "acolhedor",
    greeting: "Oi! Sou a Íris, assistente virtual da Clínica Sorriso Vivo.",
    canSchedule: true,
    answerOutsideHours: true,
    handoffKeywords: "advogado, processo, reembolso, ouvidoria",
    maxAiMessages: 0,
    extraInstructions:
      "Estacionamento conveniado no prédio ao lado. A primeira avaliação é sempre com a Dra. Helena.",
    updatedAt: new Date(),
  });

  // ---- estoque -------------------------------------------------------------
  // quantity é o saldo materializado; stockMoves é o histórico que o explica.
  const stock = [
    { name: "Luva de procedimento M", category: "Descartáveis", unit: "cx", qty: 24, min: 10, supplier: "Dental Cremer" },
    { name: "Máscara cirúrgica tripla", category: "Descartáveis", unit: "cx", qty: 6, min: 8, supplier: "Dental Cremer" },
    { name: "Anestésico Lidocaína 2%", category: "Anestésicos", unit: "cx", qty: 12, min: 4, supplier: "Dental Speed" },
    { name: "Agulha gengival curta", category: "Anestésicos", unit: "cx", qty: 3, min: 5, supplier: "Dental Speed" },
    { name: "Resina composta A2", category: "Restauradores", unit: "un", qty: 9, min: 4, supplier: "Odonto Prime" },
    { name: "Ácido fosfórico 37%", category: "Restauradores", unit: "un", qty: 5, min: 3, supplier: "Odonto Prime" },
    { name: "Lima endodôntica sortida", category: "Endodontia", unit: "kit", qty: 7, min: 3, supplier: "Dental Cremer" },
    { name: "Sugador descartável", category: "Descartáveis", unit: "cx", qty: 0, min: 6, supplier: "Dental Cremer" },
    { name: "Gaze estéril", category: "Descartáveis", unit: "cx", qty: 18, min: 8, supplier: "Odonto Prime" },
    { name: "Flúor gel neutro", category: "Prevenção", unit: "un", qty: 11, min: 5, supplier: "Dental Speed" },
  ];
  const moves: (typeof stockMoves.$inferInsert)[] = [];
  for (const it of stock) {
    const id = newId("stk_");
    await db.insert(stockItems).values({
      id,
      clinicId: CLINIC_ID,
      name: it.name,
      category: it.category,
      unit: it.unit,
      quantity: it.qty,
      minQuantity: it.min,
      supplier: it.supplier,
    });
    // uma entrada de compra e algumas saídas de consumo que fecham no saldo atual
    const entrada = it.qty + 6;
    moves.push({
      id: newId("mov_"), clinicId: CLINIC_ID, itemId: id, kind: "in",
      quantity: entrada, note: "Compra do mês", userId: "user_admin",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    });
    moves.push({
      id: newId("mov_"), clinicId: CLINIC_ID, itemId: id, kind: "out",
      quantity: 6, note: "Uso no atendimento", userId: "user_recep",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  }
  await db.insert(stockMoves).values(moves);

  // ---- trabalhos protéticos ------------------------------------------------
  await db.insert(labCases).values([
    {
      id: newId("lab_"), clinicId: CLINIC_ID, patientId: "pat_4", dentistId: "user_rafael",
      lab: "Prótese Arte Dental", work: "Coroa de porcelana sobre implante", teeth: "36",
      status: "sent", sentOn: addDays(today, -6), dueOn: addDays(today, 2),
      costCents: 68000, note: "Cor A2, modelo enviado junto.",
    },
    {
      id: newId("lab_"), clinicId: CLINIC_ID, patientId: "pat_8", dentistId: "user_rafael",
      lab: "Prótese Arte Dental", work: "Provisório em resina", teeth: "21, 22",
      status: "sent", sentOn: addDays(today, -11), dueOn: addDays(today, -3),
      costCents: 24000,
    },
    {
      id: newId("lab_"), clinicId: CLINIC_ID, patientId: "pat_10", dentistId: "user_helena",
      lab: "Lab Oral Design", work: "Faceta de porcelana", teeth: "11, 12, 21, 22",
      status: "returned", sentOn: addDays(today, -14), dueOn: addDays(today, -1),
      returnedOn: addDays(today, -1), costCents: 152000, note: "Conferir cor antes de cimentar.",
    },
    {
      id: newId("lab_"), clinicId: CLINIC_ID, patientId: "pat_2", dentistId: "user_helena",
      lab: "Lab Oral Design", work: "Placa de bruxismo", teeth: "Arcada superior",
      status: "delivered", sentOn: addDays(today, -28), dueOn: addDays(today, -18),
      returnedOn: addDays(today, -19), costCents: 45000,
    },
  ]);

  console.log("Seed concluído.");
  console.log("Login: admin@sorrisovivo.com.br / alveo123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

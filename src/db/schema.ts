import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Convenções do schema:
 * - ids são text (nanoid gerado na aplicação);
 * - toda tabela de domínio carrega `clinicId` — o sistema é multi-clínica e
 *   nenhuma query pode cruzar esse limite;
 * - data de agenda é `date` (YYYY-MM-DD) + minutos desde a meia-noite, o que
 *   deixa a grade e as comparações de horário triviais e livres de fuso;
 * - dinheiro é sempre `integer` em centavos;
 * - o banco é Postgres (Supabase); ids continuam sendo gerados na aplicação.
 */

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const clinics = pgTable("clinics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  phone: text("phone"),
  address: text("address"),
  /** Responsável técnico (CRO) exibido em documentos. */
  croResponsible: text("cro_responsible"),
  openingMin: integer("opening_min").notNull().default(480), // 08:00
  closingMin: integer("closing_min").notNull().default(1140), // 19:00
  slotMin: integer("slot_min").notNull().default(30),
  createdAt,
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    /** admin: tudo | dentist: agenda e clínico | reception: agenda e cadastro */
    role: text("role", { enum: ["admin", "dentist", "reception"] })
      .notNull()
      .default("reception"),
    cro: text("cro"),
    specialty: text("specialty"),
    color: text("color").notNull().default("#c6e31a"),
    active: boolean("active").notNull().default(true),
    createdAt,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const chairs = pgTable("chairs", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const procedures = pgTable("procedures", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  specialty: text("specialty"),
  /** Código TUSS/AMB quando houver convênio. */
  code: text("code"),
  durationMin: integer("duration_min").notNull().default(30),
  priceCents: integer("price_cents").notNull().default(0),
  /** Procedimento é aplicado a um dente específico (restauração, canal…). */
  perTooth: boolean("per_tooth").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const patients = pgTable(
  "patients",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    /** Número de prontuário, sequencial dentro da clínica. */
    code: integer("code"),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    cpf: text("cpf"),
    /** Como o paciente conheceu a clínica. */
    source: text("source"),
    birthDate: text("birth_date"),
    address: text("address"),
    insurance: text("insurance"),
    /** Anamnese resumida: alergias, medicamentos em uso, condições. */
    healthNotes: text("health_notes"),
    notes: text("notes"),
    createdAt,
  },
  (t) => [index("patients_clinic_idx").on(t.clinicId, t.name)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    dentistId: text("dentist_id")
      .notNull()
      .references(() => users.id),
    chairId: text("chair_id").references(() => chairs.id),
    procedureId: text("procedure_id").references(() => procedures.id),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    status: text("status", {
      enum: [
        "scheduled",
        "confirmed",
        "arrived",
        "attended",
        "noshow",
        "rescheduled",
        "canceled",
      ],
    })
      .notNull()
      .default("scheduled"),
    /** Por que faltou, remarcou ou cancelou — a recepção precisa registrar. */
    statusNote: text("status_note"),
    /** Motivo da consulta, informado no agendamento. */
    reason: text("reason"),
    /** Horário real de chegada do paciente na recepção. */
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    /** Quem marcou: a equipe, a IA no WhatsApp ou o próprio paciente online. */
    source: text("source", { enum: ["staff", "ai", "online"] })
      .notNull()
      .default("staff"),
    notes: text("notes"),
    createdAt,
  },
  (t) => [index("appointments_day_idx").on(t.clinicId, t.date)],
);

/** Estado corrente de cada dente/face no odontograma. */
export const toothRecords = pgTable(
  "tooth_records",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    /** Notação FDI: 11–48 (permanentes), 51–85 (decíduos). */
    tooth: integer("tooth").notNull(),
    /** V, L, M, D, O/I — vazio quando a condição é do dente inteiro. */
    face: text("face"),
    condition: text("condition", {
      enum: [
        "healthy",
        "caries",
        "restored",
        "root_canal",
        "crown",
        "implant",
        "extracted",
        "absent",
        "fracture",
      ],
    }).notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tooth_patient_idx").on(t.patientId, t.tooth)],
);

export const treatmentPlans = pgTable("treatment_plans", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  dentistId: text("dentist_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  status: text("status", {
    enum: ["draft", "presented", "accepted", "in_progress", "done", "refused"],
  })
    .notNull()
    .default("draft"),
  discountCents: integer("discount_cents").notNull().default(0),
  notes: text("notes"),
  createdAt,
});

export const treatmentItems = pgTable(
  "treatment_items",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => treatmentPlans.id, { onDelete: "cascade" }),
    procedureId: text("procedure_id")
      .notNull()
      .references(() => procedures.id),
    tooth: integer("tooth"),
    faces: text("faces"),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status", { enum: ["pending", "done", "canceled"] })
      .notNull()
      .default("pending"),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (t) => [index("treatment_items_plan_idx").on(t.planId)],
);

/** Evolução clínica — o prontuário propriamente dito. */
export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: text("appointment_id").references(() => appointments.id),
    dentistId: text("dentist_id")
      .notNull()
      .references(() => users.id),
    text: text("text").notNull(),
    createdAt,
  },
  (t) => [index("clinical_notes_patient_idx").on(t.patientId)],
);

export const financeEntries = pgTable(
  "finance_entries",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id").references(() => patients.id, {
      onDelete: "set null",
    }),
    planId: text("plan_id").references(() => treatmentPlans.id, {
      onDelete: "set null",
    }),
    type: text("type", { enum: ["income", "expense"] })
      .notNull()
      .default("income"),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    /** Quanto já foi recebido — permite pagamento parcial e em várias formas. */
    paidCents: integer("paid_cents").notNull().default(0),
    /** YYYY-MM-DD */
    dueDate: text("due_date").notNull(),
    paidAt: text("paid_at"),
    method: text("method", {
      enum: ["pix", "cash", "credit", "debit", "transfer", "insurance"],
    }),
    installment: integer("installment"),
    installments: integer("installments"),
    createdAt,
  },
  (t) => [index("finance_due_idx").on(t.clinicId, t.dueDate)],
);

/** Conversas da Íris no WhatsApp. */
export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id").references(() => patients.id, {
      onDelete: "set null",
    }),
    phone: text("phone").notNull(),
    contactName: text("contact_name"),
    status: text("status", { enum: ["ai", "human", "closed"] })
      .notNull()
      .default("ai"),
    /** Motivo da transferência para um humano, quando houver. */
    handoffReason: text("handoff_reason"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [index("conversations_clinic_idx").on(t.clinicId, t.lastMessageAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["patient", "ai", "staff"] }).notNull(),
    /** Em áudio, `text` guarda a legenda (ou vazio) e o som vai em mediaPath. */
    kind: text("kind", { enum: ["text", "audio"] })
      .notNull()
      .default("text"),
    text: text("text").notNull(),
    /** Nome do arquivo dentro de data/media — nunca um caminho absoluto. */
    mediaPath: text("media_path"),
    durationMs: integer("duration_ms"),
    createdAt,
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

/**
 * Estoque: o item guarda o saldo atual e cada movimento fica registrado.
 * O saldo podia ser derivado dos movimentos, mas a recepção consulta a lista
 * o tempo todo — manter a soma pronta evita varrer o histórico a cada tela.
 */
export const stockItems = pgTable(
  "stock_items",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    /** un, cx, ml, g, par… */
    unit: text("unit").notNull().default("un"),
    quantity: integer("quantity").notNull().default(0),
    /** Abaixo disso o item aparece como "repor". */
    minQuantity: integer("min_quantity").notNull().default(0),
    supplier: text("supplier"),
    active: boolean("active").notNull().default(true),
    createdAt,
  },
  (t) => [index("stock_items_clinic_idx").on(t.clinicId, t.name)],
);

export const stockMoves = pgTable(
  "stock_moves",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "cascade" }),
    /** in: compra/reposição · out: consumo · adjust: correção de contagem */
    kind: text("kind", { enum: ["in", "out", "adjust"] }).notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt,
  },
  (t) => [index("stock_moves_item_idx").on(t.itemId, t.createdAt)],
);

/**
 * Trabalhos enviados ao laboratório de prótese: o que foi, para quem, quando
 * volta e quanto custou. É o caderninho do protético dentro do sistema.
 */
export const labCases = pgTable(
  "lab_cases",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    dentistId: text("dentist_id")
      .notNull()
      .references(() => users.id),
    lab: text("lab").notNull(),
    work: text("work").notNull(),
    /** Dentes envolvidos, em texto livre: "36, 37" ou "arcada superior". */
    teeth: text("teeth"),
    /** sent: enviado · returned: voltou do laboratório · delivered: instalado */
    status: text("status", { enum: ["sent", "returned", "delivered", "canceled"] })
      .notNull()
      .default("sent"),
    /** YYYY-MM-DD */
    sentOn: text("sent_on").notNull(),
    dueOn: text("due_on"),
    returnedOn: text("returned_on"),
    costCents: integer("cost_cents").notNull().default(0),
    note: text("note"),
    createdAt,
  },
  (t) => [index("lab_cases_clinic_idx").on(t.clinicId, t.status, t.dueOn)],
);

/**
 * Ajustes da Íris por clínica. Fica fora de `clinics` porque é a configuração
 * de um produto (a IA), não um dado cadastral — e porque cresce sozinha.
 * Tudo aqui muda o comportamento real do motor em `src/lib/iris.ts`.
 */
export const irisSettings = pgTable("iris_settings", {
  clinicId: text("clinic_id")
    .primaryKey()
    .references(() => clinics.id, { onDelete: "cascade" }),
  /** Desligada, a Íris não responde: toda conversa nova já nasce com a equipe. */
  active: boolean("active").notNull().default(true),
  /** acolhedor | direto | formal — entra no prompt como instrução de tom. */
  tone: text("tone", { enum: ["acolhedor", "direto", "formal"] })
    .notNull()
    .default("acolhedor"),
  /** Como ela se apresenta na primeira mensagem da conversa. */
  greeting: text("greeting"),
  /** Com isso desligado ela informa e transfere, mas não marca sozinha. */
  canSchedule: boolean("can_schedule").notNull().default(true),
  /** Fora do horário da clínica: responder normalmente ou só avisar. */
  answerOutsideHours: boolean("answer_outside_hours")
    .notNull()
    .default(true),
  awayMessage: text("away_message"),
  /** Palavras que forçam transferência imediata, separadas por vírgula. */
  handoffKeywords: text("handoff_keywords"),
  /** Respostas da IA na mesma conversa antes de passar para a equipe. 0 = sem limite. */
  maxAiMessages: integer("max_ai_messages").notNull().default(0),
  /** Texto livre acrescentado ao fim do prompt. */
  extraInstructions: text("extra_instructions"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

/**
 * Documentos emitidos para o paciente: recibo, atestado, encaminhamento,
 * receita e pedido de exame. O corpo é texto puro, montado a partir de um
 * modelo e editável antes de salvar — o que for impresso fica registrado.
 */
export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    /** recibo | atestado | encaminhamento | receita | exame | contrato */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    createdAt,
  },
  (t) => [index("documents_patient_idx").on(t.patientId, t.createdAt)],
);

/**
 * Lembrete preso ao paciente: "ligar no dia 15 porque o cartão dele vira".
 * Vence numa data e aparece na visão geral até alguém marcar como feito.
 */
export const patientReminders = pgTable(
  "patient_reminders",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD */
    dueDate: text("due_date").notNull(),
    note: text("note").notNull(),
    done: boolean("done").notNull().default(false),
    createdAt,
  },
  (t) => [index("patient_reminders_idx").on(t.clinicId, t.dueDate)],
);

/** Pagamentos avulsos de um lançamento — parcial e em formas diferentes. */
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    entryId: text("entry_id")
      .notNull()
      .references(() => financeEntries.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    method: text("method", {
      enum: ["pix", "cash", "credit", "debit", "transfer", "insurance"],
    }),
    /** YYYY-MM-DD */
    paidOn: text("paid_on").notNull(),
    note: text("note"),
    createdAt,
  },
  (t) => [index("payments_entry_idx").on(t.entryId)],
);

/** Campanhas automáticas: cada linha é um tipo ligado/desligado na clínica. */
export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    /** birthday | recall | reactivation | overdue | satisfaction | custom */
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    template: text("template").notNull(),
    active: boolean("active").notNull().default(false),
    /** Parâmetros do público, em JSON (meses de inatividade, convênio…). */
    config: text("config"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [index("campaigns_clinic_idx").on(t.clinicId)],
);

/** Registro de cada mensagem disparada — evita mandar duas vezes no mesmo dia. */
export const campaignSends = pgTable(
  "campaign_sends",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    text: text("text").notNull(),
    delivered: boolean("delivered").notNull().default(false),
    /** YYYY-MM-DD do disparo. */
    sentOn: text("sent_on").notNull(),
    createdAt,
  },
  (t) => [index("campaign_sends_idx").on(t.campaignId, t.patientId, t.sentOn)],
);

export type Campaign = typeof campaigns.$inferSelect;
export type ClinicDocument = typeof documents.$inferSelect;
export type StockItem = typeof stockItems.$inferSelect;
export type LabCase = typeof labCases.$inferSelect;
export type IrisSettings = typeof irisSettings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Procedure = typeof procedures.$inferSelect;
export type TreatmentPlan = typeof treatmentPlans.$inferSelect;
export type FinanceEntry = typeof financeEntries.$inferSelect;
export type ToothRecord = typeof toothRecords.$inferSelect;

CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"dentist_id" text NOT NULL,
	"chair_id" text,
	"procedure_id" text,
	"date" text NOT NULL,
	"start_min" integer NOT NULL,
	"end_min" integer NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"status_note" text,
	"reason" text,
	"arrived_at" timestamp with time zone,
	"source" text DEFAULT 'staff' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_sends" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"phone" text NOT NULL,
	"text" text NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"sent_on" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"template" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"config" text,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chairs" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"appointment_id" text,
	"dentist_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"phone" text,
	"address" text,
	"cro_responsible" text,
	"opening_min" integer DEFAULT 480 NOT NULL,
	"closing_min" integer DEFAULT 1140 NOT NULL,
	"slot_min" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text,
	"phone" text NOT NULL,
	"contact_name" text,
	"status" text DEFAULT 'ai' NOT NULL,
	"handoff_reason" text,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text,
	"plan_id" text,
	"type" text DEFAULT 'income' NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_cents" integer DEFAULT 0 NOT NULL,
	"due_date" text NOT NULL,
	"paid_at" text,
	"method" text,
	"installment" integer,
	"installments" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iris_settings" (
	"clinic_id" text PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"tone" text DEFAULT 'acolhedor' NOT NULL,
	"greeting" text,
	"can_schedule" boolean DEFAULT true NOT NULL,
	"answer_outside_hours" boolean DEFAULT true NOT NULL,
	"away_message" text,
	"handoff_keywords" text,
	"max_ai_messages" integer DEFAULT 0 NOT NULL,
	"extra_instructions" text,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lab_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"dentist_id" text NOT NULL,
	"lab" text NOT NULL,
	"work" text NOT NULL,
	"teeth" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_on" text NOT NULL,
	"due_on" text,
	"returned_on" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"text" text NOT NULL,
	"media_path" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"due_date" text NOT NULL,
	"note" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"code" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"cpf" text,
	"source" text,
	"birth_date" text,
	"address" text,
	"insurance" text,
	"health_notes" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"method" text,
	"paid_on" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"code" text,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"per_tooth" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'un' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"supplier" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_moves" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"item_id" text NOT NULL,
	"kind" text NOT NULL,
	"quantity" integer NOT NULL,
	"note" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tooth_records" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"tooth" integer NOT NULL,
	"face" text,
	"condition" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_items" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"procedure_id" text NOT NULL,
	"tooth" integer,
	"faces" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "treatment_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"dentist_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'reception' NOT NULL,
	"cro" text,
	"specialty" text,
	"color" text DEFAULT '#c6e31a' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_dentist_id_users_id_fk" FOREIGN KEY ("dentist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_chair_id_chairs_id_fk" FOREIGN KEY ("chair_id") REFERENCES "public"."chairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chairs" ADD CONSTRAINT "chairs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_dentist_id_users_id_fk" FOREIGN KEY ("dentist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_plan_id_treatment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iris_settings" ADD CONSTRAINT "iris_settings_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_dentist_id_users_id_fk" FOREIGN KEY ("dentist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_reminders" ADD CONSTRAINT "patient_reminders_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_reminders" ADD CONSTRAINT "patient_reminders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_entry_id_finance_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."finance_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_item_id_stock_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tooth_records" ADD CONSTRAINT "tooth_records_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tooth_records" ADD CONSTRAINT "tooth_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_items" ADD CONSTRAINT "treatment_items_plan_id_treatment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_items" ADD CONSTRAINT "treatment_items_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_dentist_id_users_id_fk" FOREIGN KEY ("dentist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_day_idx" ON "appointments" USING btree ("clinic_id","date");--> statement-breakpoint
CREATE INDEX "campaign_sends_idx" ON "campaign_sends" USING btree ("campaign_id","patient_id","sent_on");--> statement-breakpoint
CREATE INDEX "campaigns_clinic_idx" ON "campaigns" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "clinical_notes_patient_idx" ON "clinical_notes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "conversations_clinic_idx" ON "conversations" USING btree ("clinic_id","last_message_at");--> statement-breakpoint
CREATE INDEX "documents_patient_idx" ON "documents" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "finance_due_idx" ON "finance_entries" USING btree ("clinic_id","due_date");--> statement-breakpoint
CREATE INDEX "lab_cases_clinic_idx" ON "lab_cases" USING btree ("clinic_id","status","due_on");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "patient_reminders_idx" ON "patient_reminders" USING btree ("clinic_id","due_date");--> statement-breakpoint
CREATE INDEX "patients_clinic_idx" ON "patients" USING btree ("clinic_id","name");--> statement-breakpoint
CREATE INDEX "payments_entry_idx" ON "payments" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "stock_items_clinic_idx" ON "stock_items" USING btree ("clinic_id","name");--> statement-breakpoint
CREATE INDEX "stock_moves_item_idx" ON "stock_moves" USING btree ("item_id","created_at");--> statement-breakpoint
CREATE INDEX "tooth_patient_idx" ON "tooth_records" USING btree ("patient_id","tooth");--> statement-breakpoint
CREATE INDEX "treatment_items_plan_idx" ON "treatment_items" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
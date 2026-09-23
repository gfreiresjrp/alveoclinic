-- Dados de demonstração da Alveo Clinic.
-- Gerado por scripts/export-seed-sql.ts a partir do banco local.
-- Aplique DEPOIS da migração 0000_dapper_silk_fever.sql.

BEGIN;

-- clinics: 1 linha
INSERT INTO "clinics" ("id", "name", "cnpj", "phone", "address", "cro_responsible", "opening_min", "closing_min", "slot_min", "created_at") VALUES
  ('clinic_demo', 'Clínica Sorriso Vivo', '12.345.678/0001-90', '(11) 4002-8922', 'Rua das Acácias, 120 — Pinheiros, São Paulo/SP', 'CRO-SP 45.821', 480, 1140, 30, to_timestamp(1790120065000 / 1000.0));

-- users: 4 linhas
INSERT INTO "users" ("id", "clinic_id", "name", "email", "password_hash", "role", "cro", "specialty", "color", "active", "created_at") VALUES
  ('user_admin', 'clinic_demo', 'Gabriel Freire', 'admin@sorrisovivo.com.br', 'pbkdf2$210000$d4ea7675ff22c5896cd864067b086d1f$39b9ca605db822d73576746fee4222e0dfd5b227a3175b357dde6b3397e73af3', 'admin', NULL, 'Gestão', '#0b1d3a', true, to_timestamp(1790120065000 / 1000.0)),
  ('user_helena', 'clinic_demo', 'Dra. Helena Marques', 'helena@sorrisovivo.com.br', 'pbkdf2$210000$d4ea7675ff22c5896cd864067b086d1f$39b9ca605db822d73576746fee4222e0dfd5b227a3175b357dde6b3397e73af3', 'dentist', 'CRO-SP 45.821', 'Clínica geral e estética', '#2563eb', true, to_timestamp(1790120065000 / 1000.0)),
  ('user_rafael', 'clinic_demo', 'Dr. Rafael Nunes', 'rafael@sorrisovivo.com.br', 'pbkdf2$210000$d4ea7675ff22c5896cd864067b086d1f$39b9ca605db822d73576746fee4222e0dfd5b227a3175b357dde6b3397e73af3', 'dentist', 'CRO-SP 52.114', 'Implantodontia', '#7c3aed', true, to_timestamp(1790120065000 / 1000.0)),
  ('user_recep', 'clinic_demo', 'Bianca Souza', 'recepcao@sorrisovivo.com.br', 'pbkdf2$210000$d4ea7675ff22c5896cd864067b086d1f$39b9ca605db822d73576746fee4222e0dfd5b227a3175b357dde6b3397e73af3', 'reception', NULL, NULL, '#64748b', true, to_timestamp(1790120065000 / 1000.0));

-- chairs: 3 linhas
INSERT INTO "chairs" ("id", "clinic_id", "name", "active") VALUES
  ('chair_1', 'clinic_demo', 'Consultório 1', true),
  ('chair_2', 'clinic_demo', 'Consultório 2', true),
  ('chair_3', 'clinic_demo', 'Consultório 3', true);

-- procedures: 16 linhas
INSERT INTO "procedures" ("id", "clinic_id", "name", "specialty", "code", "duration_min", "price_cents", "per_tooth", "active") VALUES
  ('proc_1', 'clinic_demo', 'Avaliação e diagnóstico', 'Clínica geral', NULL, 30, 12000, false, true),
  ('proc_2', 'clinic_demo', 'Profilaxia (limpeza)', 'Clínica geral', NULL, 40, 18000, false, true),
  ('proc_3', 'clinic_demo', 'Restauração em resina', 'Dentística', NULL, 50, 28000, true, true),
  ('proc_4', 'clinic_demo', 'Extração simples', 'Cirurgia', NULL, 40, 32000, true, true),
  ('proc_5', 'clinic_demo', 'Extração de siso', 'Cirurgia', NULL, 70, 85000, true, true),
  ('proc_6', 'clinic_demo', 'Tratamento de canal', 'Endodontia', NULL, 90, 95000, true, true),
  ('proc_7', 'clinic_demo', 'Clareamento a laser', 'Estética', NULL, 60, 120000, false, true),
  ('proc_8', 'clinic_demo', 'Clareamento caseiro', 'Estética', NULL, 30, 85000, false, true),
  ('proc_9', 'clinic_demo', 'Faceta em resina', 'Estética', NULL, 80, 95000, true, true),
  ('proc_10', 'clinic_demo', 'Coroa de porcelana', 'Prótese', NULL, 70, 180000, true, true),
  ('proc_11', 'clinic_demo', 'Implante unitário', 'Implantodontia', NULL, 90, 350000, true, true),
  ('proc_12', 'clinic_demo', 'Manutenção de aparelho', 'Ortodontia', NULL, 30, 18000, false, true),
  ('proc_13', 'clinic_demo', 'Instalação de aparelho fixo', 'Ortodontia', NULL, 80, 150000, false, true),
  ('proc_14', 'clinic_demo', 'Raspagem periodontal', 'Periodontia', NULL, 60, 45000, false, true),
  ('proc_15', 'clinic_demo', 'Aplicação de flúor', 'Odontopediatria', NULL, 20, 9000, false, true),
  ('proc_16', 'clinic_demo', 'Urgência — dor', 'Clínica geral', NULL, 30, 15000, false, true);

-- patients: 12 linhas
INSERT INTO "patients" ("id", "clinic_id", "name", "phone", "email", "cpf", "birth_date", "address", "insurance", "health_notes", "notes", "created_at", "code", "source") VALUES
  ('pat_1', 'clinic_demo', 'Mariana Alves', '(11) 98812-4477', NULL, NULL, '1991-04-12', NULL, 'Unimed', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 1, 'Indicação de paciente'),
  ('pat_2', 'clinic_demo', 'Carlos Eduardo Lima', '(11) 99654-1120', NULL, NULL, '1978-11-03', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 2, 'Instagram'),
  ('pat_3', 'clinic_demo', 'Juliana Prado', '(11) 97733-8890', NULL, NULL, '1995-07-25', NULL, 'Amil Dental', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 3, 'Google'),
  ('pat_4', 'clinic_demo', 'Roberto Tanaka', '(11) 98123-5567', NULL, NULL, '1965-02-18', NULL, NULL, 'Hipertenso, usa losartana. Alergia a dipirona.', NULL, to_timestamp(1790120065000 / 1000.0), 4, 'Placa / fachada'),
  ('pat_5', 'clinic_demo', 'Fernanda Castro', '(11) 99012-3345', NULL, NULL, '1988-09-30', NULL, 'Unimed', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 5, 'Convênio'),
  ('pat_6', 'clinic_demo', 'Paulo Henrique Dias', '(11) 98456-7781', NULL, NULL, '2001-12-09', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 6, 'Facebook'),
  ('pat_7', 'clinic_demo', 'Aline Ribeiro', '(11) 97211-6654', NULL, NULL, '1993-05-14', NULL, 'Porto Seguro', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 7, 'Indicação de paciente'),
  ('pat_8', 'clinic_demo', 'Marcos Vinícius Rocha', '(11) 99887-2210', NULL, NULL, '1984-08-21', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 8, 'Instagram'),
  ('pat_9', 'clinic_demo', 'Beatriz Nogueira', '(11) 98345-9912', NULL, NULL, '2016-03-07', NULL, 'Amil Dental', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 9, 'Google'),
  ('pat_10', 'clinic_demo', 'Sandra Meireles', '(11) 97654-3301', NULL, NULL, '1959-10-11', NULL, NULL, 'Diabética tipo 2.', NULL, to_timestamp(1790120065000 / 1000.0), 10, 'Placa / fachada'),
  ('pat_11', 'clinic_demo', 'Thiago Barbosa', '(11) 99321-7788', NULL, NULL, '1999-01-27', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 11, 'Convênio'),
  ('pat_12', 'clinic_demo', 'Letícia Ramos', '(11) 98770-5523', NULL, NULL, '1990-06-02', NULL, 'Unimed', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 12, 'Facebook');

-- appointments: 24 linhas
INSERT INTO "appointments" ("id", "clinic_id", "patient_id", "dentist_id", "chair_id", "procedure_id", "date", "start_min", "end_min", "status", "source", "notes", "created_at", "status_note", "reason", "arrived_at") VALUES
  ('apt_0mudb9mcapzeg5p4e', 'clinic_demo', 'pat_1', 'user_helena', 'chair_1', 'proc_2', '2026-09-21', 480, 520, 'attended', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcaeo0okl8g', 'clinic_demo', 'pat_2', 'user_helena', 'chair_1', 'proc_3', '2026-09-21', 540, 590, 'attended', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcai61v3rs0', 'clinic_demo', 'pat_4', 'user_rafael', 'chair_2', 'proc_11', '2026-09-21', 600, 690, 'attended', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcab3hwsg3m', 'clinic_demo', 'pat_3', 'user_helena', 'chair_1', 'proc_7', '2026-09-21', 840, 900, 'attended', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcavta5g4qu', 'clinic_demo', 'pat_8', 'user_rafael', 'chair_2', 'proc_6', '2026-09-21', 930, 1020, 'noshow', 'online', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mca5ixc4trz', 'clinic_demo', 'pat_5', 'user_helena', 'chair_1', 'proc_1', '2026-09-22', 510, 540, 'attended', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcay120a53w', 'clinic_demo', 'pat_6', 'user_rafael', 'chair_2', 'proc_5', '2026-09-22', 570, 640, 'attended', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcakchbxltr', 'clinic_demo', 'pat_9', 'user_helena', 'chair_3', 'proc_15', '2026-09-22', 660, 680, 'attended', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcab4zmk78q', 'clinic_demo', 'pat_7', 'user_helena', 'chair_1', 'proc_14', '2026-09-22', 840, 900, 'attended', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mca2c8qnmvb', 'clinic_demo', 'pat_10', 'user_rafael', 'chair_2', 'proc_4', '2026-09-23', 480, 520, 'confirmed', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcaslcq9xu5', 'clinic_demo', 'pat_11', 'user_helena', 'chair_1', 'proc_12', '2026-09-23', 540, 570, 'confirmed', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mca70iitofo', 'clinic_demo', 'pat_12', 'user_helena', 'chair_1', 'proc_2', '2026-09-23', 600, 640, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mca85o0fbpm', 'clinic_demo', 'pat_1', 'user_helena', 'chair_1', 'proc_3', '2026-09-23', 840, 890, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcatepsl42t', 'clinic_demo', 'pat_4', 'user_rafael', 'chair_2', 'proc_11', '2026-09-23', 900, 990, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcayxr5nlgx', 'clinic_demo', 'pat_3', 'user_helena', 'chair_1', 'proc_9', '2026-09-24', 510, 590, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcan0zhgjvo', 'clinic_demo', 'pat_5', 'user_rafael', 'chair_2', 'proc_10', '2026-09-24', 600, 670, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcaiixrv0yo', 'clinic_demo', 'pat_8', 'user_helena', 'chair_3', 'proc_16', '2026-09-24', 660, 690, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcao7znf3bk', 'clinic_demo', 'pat_2', 'user_helena', 'chair_1', 'proc_6', '2026-09-24', 870, 960, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mca61udj8mi', 'clinic_demo', 'pat_6', 'user_helena', 'chair_1', 'proc_13', '2026-09-25', 480, 560, 'scheduled', 'online', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcaus04ej1l', 'clinic_demo', 'pat_7', 'user_helena', 'chair_1', 'proc_2', '2026-09-25', 570, 610, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcafabxl7rn', 'clinic_demo', 'pat_12', 'user_rafael', 'chair_2', 'proc_1', '2026-09-25', 660, 690, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcasms6a6kj', 'clinic_demo', 'pat_10', 'user_helena', 'chair_1', 'proc_14', '2026-09-25', 840, 900, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcaue5956zr', 'clinic_demo', 'pat_11', 'user_helena', 'chair_1', 'proc_7', '2026-09-26', 540, 600, 'scheduled', 'ai', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL),
  ('apt_0mudb9mcahtladr2h', 'clinic_demo', 'pat_9', 'user_helena', 'chair_3', 'proc_15', '2026-09-26', 630, 650, 'scheduled', 'staff', NULL, to_timestamp(1790120065000 / 1000.0), NULL, NULL, NULL);

-- tooth_records: 7 linhas
INSERT INTO "tooth_records" ("id", "clinic_id", "patient_id", "tooth", "face", "condition", "note", "updated_at") VALUES
  ('th_0mudb9mcbjyyy4kh9', 'clinic_demo', 'pat_1', 16, 'O', 'restored', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcb19dyg248', 'clinic_demo', 'pat_1', 26, 'M', 'caries', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcbzmrtxk08', 'clinic_demo', 'pat_1', 36, NULL, 'root_canal', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcb8b8tedgl', 'clinic_demo', 'pat_1', 46, NULL, 'crown', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcby262lc8m', 'clinic_demo', 'pat_1', 18, NULL, 'extracted', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcb4pp3jtgu', 'clinic_demo', 'pat_1', 28, NULL, 'absent', NULL, to_timestamp(1790120065000 / 1000.0)),
  ('th_0mudb9mcbnalumh5o', 'clinic_demo', 'pat_1', 11, 'V', 'caries', NULL, to_timestamp(1790120065000 / 1000.0));

-- treatment_plans: 1 linha
INSERT INTO "treatment_plans" ("id", "clinic_id", "patient_id", "dentist_id", "title", "status", "discount_cents", "notes", "created_at") VALUES
  ('plan_1', 'clinic_demo', 'pat_1', 'user_helena', 'Reabilitação estética e restauradora', 'accepted', 10000, 'Paciente optou por dividir em 4x no cartão.', to_timestamp(1790120065000 / 1000.0));

-- treatment_items: 4 linhas
INSERT INTO "treatment_items" ("id", "plan_id", "procedure_id", "tooth", "faces", "price_cents", "status", "done_at") VALUES
  ('ti_0mudb9mcc6ajbweas', 'plan_1', 'proc_3', 26, 'M', 28000, 'pending', NULL),
  ('ti_0mudb9mccnire5hxk', 'plan_1', 'proc_3', 11, 'V', 28000, 'done', to_timestamp(1790120065116 / 1000.0)),
  ('ti_0mudb9mccz9xobxt2', 'plan_1', 'proc_7', NULL, NULL, 120000, 'pending', NULL),
  ('ti_0mudb9mcct0c20iyu', 'plan_1', 'proc_2', NULL, NULL, 18000, 'done', to_timestamp(1790120065116 / 1000.0));

-- clinical_notes: 2 linhas
INSERT INTO "clinical_notes" ("id", "clinic_id", "patient_id", "appointment_id", "dentist_id", "text", "created_at") VALUES
  ('cn_0mudb9mccz83b7dgb', 'clinic_demo', 'pat_1', NULL, 'user_helena', 'Profilaxia realizada. Orientação de higiene e uso de fio dental. Paciente relata sensibilidade no 26 ao frio; cárie oclusomesial confirmada em exame clínico. Plano de tratamento apresentado e aceito.', to_timestamp(1790120065000 / 1000.0)),
  ('cn_0mudb9mcclb0uv6p9', 'clinic_demo', 'pat_1', NULL, 'user_helena', 'Restauração em resina no 11 face vestibular. Isolamento absoluto, anestesia infiltrativa com lidocaína 2%. Sem intercorrências.', to_timestamp(1790120065000 / 1000.0));

-- finance_entries: 14 linhas
INSERT INTO "finance_entries" ("id", "clinic_id", "patient_id", "plan_id", "type", "description", "amount_cents", "due_date", "paid_at", "method", "installment", "installments", "created_at", "paid_cents") VALUES
  ('fin_0mudb9mcd6s4golc9', 'clinic_demo', 'pat_1', NULL, 'income', 'Restauração 11 — Mariana Alves', 28000, '2026-09-10', '2026-09-10', 'pix', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 28000),
  ('fin_0mudb9mcd9tcnycc6', 'clinic_demo', 'pat_1', NULL, 'income', 'Profilaxia — Mariana Alves', 18000, '2026-09-10', '2026-09-10', 'credit', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 18000),
  ('fin_0mudb9mcdx5zpv2rb', 'clinic_demo', 'pat_1', NULL, 'income', 'Clareamento a laser — parcela 1/4', 30000, '2026-09-20', '2026-09-20', 'credit', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 30000),
  ('fin_0mudb9mcdvg2zabg1', 'clinic_demo', 'pat_1', NULL, 'income', 'Clareamento a laser — parcela 2/4', 30000, '2026-10-20', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcdohwu86pa', 'clinic_demo', 'pat_4', NULL, 'income', 'Implante unitário — Roberto Tanaka', 350000, '2026-09-17', '2026-09-17', 'transfer', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 350000),
  ('fin_0mudb9mcdir9vjs0h', 'clinic_demo', 'pat_6', NULL, 'income', 'Extração de siso — Paulo Henrique', 85000, '2026-09-19', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcdxi7i4qp1', 'clinic_demo', 'pat_7', NULL, 'income', 'Instalação de aparelho — Aline Ribeiro', 150000, '2026-09-02', '2026-09-02', 'pix', NULL, NULL, to_timestamp(1790120065000 / 1000.0), 150000),
  ('fin_0mudb9mcdl30vu36e', 'clinic_demo', 'pat_12', NULL, 'income', 'Manutenção de aparelho — Letícia Ramos', 18000, '2026-09-25', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcduny8vgb3', 'clinic_demo', 'pat_8', NULL, 'income', 'Tratamento de canal — Marcos Vinícius', 95000, '2026-09-14', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcd0vuw7iqd', 'clinic_demo', 'pat_5', NULL, 'income', 'Coroa de porcelana — Fernanda Castro', 180000, '2026-09-28', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcdi6l5c3io', 'clinic_demo', NULL, NULL, 'expense', 'Aluguel da sala', 780000, '2026-09-26', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcdvup3fid2', 'clinic_demo', NULL, NULL, 'expense', 'Materiais — fornecedor Dental Cremer', 236000, '2026-09-16', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcd94kl2ab0', 'clinic_demo', NULL, NULL, 'expense', 'Laboratório de prótese', 145000, '2026-10-01', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0),
  ('fin_0mudb9mcdlu2jlnyh', 'clinic_demo', NULL, NULL, 'expense', 'Folha da equipe', 1240000, '2026-09-26', NULL, NULL, NULL, NULL, to_timestamp(1790120065000 / 1000.0), 0);

-- conversations: 3 linhas
INSERT INTO "conversations" ("id", "clinic_id", "patient_id", "phone", "contact_name", "status", "handoff_reason", "last_message_at", "created_at") VALUES
  ('conv_1', 'clinic_demo', 'pat_12', '5511987705523', 'Letícia Ramos', 'ai', NULL, to_timestamp(1790120065118 / 1000.0), to_timestamp(1790120065000 / 1000.0)),
  ('conv_2', 'clinic_demo', NULL, '5511991234567', 'Novo contato', 'human', 'Urgência — dor', to_timestamp(1790120065118 / 1000.0), to_timestamp(1790120065000 / 1000.0)),
  ('conv_3', 'clinic_demo', NULL, '5511984449090', 'Camila', 'ai', NULL, to_timestamp(1790120065119 / 1000.0), to_timestamp(1790120065000 / 1000.0));

-- messages: 15 linhas
INSERT INTO "messages" ("id", "conversation_id", "role", "text", "created_at", "kind", "media_path", "duration_ms") VALUES
  ('msg_0mudb9mcek0a1o2xw', 'conv_1', 'patient', 'Oi, preciso remarcar minha manutenção', to_timestamp(1790118625118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcen29atr9j', 'conv_1', 'ai', 'Oi, Letícia! Claro. Sua manutenção está marcada para quarta às 14h. Prefere outro dia desta semana?', to_timestamp(1790118865118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcecz4wki2z', 'conv_1', 'patient', 'Pode ser sexta de manhã', to_timestamp(1790119105118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mceggyrv287', 'conv_1', 'ai', 'Tenho sexta às 9h30 com a Dra. Helena. Confirmo para você?', to_timestamp(1790119345118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mce50nz628o', 'conv_1', 'patient', 'Confirma sim', to_timestamp(1790119585118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcer6bb920f', 'conv_1', 'ai', 'Remarcado! Sexta, 9h30, com a Dra. Helena. Te lembro na véspera 💚', to_timestamp(1790119825118 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcfippsgsv1', 'conv_2', 'patient', 'boa noite, to com muita dor no dente do siso, ta inchado', to_timestamp(1790118865119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcfei60fcj5', 'conv_2', 'ai', 'Sinto muito, vou te ajudar agora. Sou a Íris, assistente virtual da Sorriso Vivo. Desde quando a dor começou?', to_timestamp(1790119105119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcfxj1lo1bo', 'conv_2', 'patient', 'desde ontem, não consigo dormir', to_timestamp(1790119345119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcfzhvh49yg', 'conv_2', 'ai', 'Entendi. Como há dor intensa e inchaço, vou passar você para a nossa equipe agora para encaixe de urgência.', to_timestamp(1790119585119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcf4hfubtgv', 'conv_2', 'staff', 'Oi! Aqui é a Bianca. Consigo te encaixar amanhã às 8h com o Dr. Rafael. Serve?', to_timestamp(1790119825119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcfhytils42', 'conv_3', 'patient', 'vcs fazem clareamento? qual valor', to_timestamp(1790119105119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcgeacxemyy', 'conv_3', 'ai', 'Fazemos sim, Camila! Trabalhamos com clareamento a laser e caseiro. O valor exato depende da avaliação, que custa R$ 120 e já sai com o plano de tratamento. Quer que eu veja um horário?', to_timestamp(1790119345119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcg3ppidf6i', 'conv_3', 'patient', 'quero, sábado de manhã tem?', to_timestamp(1790119585119 / 1000.0), 'text', NULL, NULL),
  ('msg_0mudb9mcg2e7qycma', 'conv_3', 'ai', 'Tenho sábado às 9h com a Dra. Helena. Posso confirmar?', to_timestamp(1790119825119 / 1000.0), 'text', NULL, NULL);

-- campaigns: 6 linhas
INSERT INTO "campaigns" ("id", "clinic_id", "kind", "name", "description", "template", "active", "config", "last_run_at", "created_at") VALUES
  ('camp_0mudbdpzg5oz7cuj0', 'clinic_demo', 'birthday', 'Aniversariantes', 'Parabeniza quem faz aniversário hoje.', 'Feliz aniversário, {paciente}! 🎉 A equipe da {clinica} deseja um dia muito especial para você.', false, '{}', NULL, to_timestamp(1790120256000 / 1000.0)),
  ('camp_0mudbdpzhgy837nv2', 'clinic_demo', 'recall', 'Retorno semestral', 'Convida quem passou pela última consulta há mais de 6 meses e não tem retorno marcado.', 'Oi, {paciente}! Faz {meses} meses desde a sua última consulta na {clinica}. Que tal agendar uma revisão? É só responder aqui que a gente marca.', false, '{"months":6}', NULL, to_timestamp(1790120256000 / 1000.0)),
  ('camp_0mudbdpzhgldes8gx', 'clinic_demo', 'reactivation', 'Reativação', 'Chama quem não aparece há mais de um ano.', 'Oi, {paciente}! Sentimos sua falta na {clinica} — sua última visita foi em {ultima_visita}. Quer marcar uma avaliação?', false, '{"months":12}', NULL, to_timestamp(1790120256000 / 1000.0)),
  ('camp_0mudbdpzhwpfeuzrq', 'clinic_demo', 'overdue', 'Inadimplentes', 'Lembra quem tem pagamento vencido em aberto.', 'Oi, {paciente}! Passando para lembrar do valor de {valor} em aberto na {clinica}. Qualquer dúvida, é só responder por aqui.', false, '{}', NULL, to_timestamp(1790120256000 / 1000.0)),
  ('camp_0mudbdpzhk9l4p2ly', 'clinic_demo', 'satisfaction', 'Pesquisa de satisfação', 'Pede a opinião de quem foi atendido no dia anterior.', 'Oi, {paciente}! Como foi seu atendimento na {clinica} ontem? Responda de 1 a 5 — sua opinião ajuda muito a gente.', false, '{"daysAfter":1}', NULL, to_timestamp(1790120256000 / 1000.0)),
  ('camp_0mudbdpzh3sbfic7m', 'clinic_demo', 'custom', 'Personalizada', 'Você escolhe o público e escreve a mensagem.', 'Oi, {paciente}! ', false, '{"months":0}', NULL, to_timestamp(1790120256000 / 1000.0));

-- patient_reminders: 2 linhas
INSERT INTO "patient_reminders" ("id", "clinic_id", "patient_id", "due_date", "note", "done", "created_at") VALUES
  ('rem_0mudb9mcdu128hy5e', 'clinic_demo', 'pat_8', '2026-09-21', 'Ligar sobre o canal do 26 — disse que o cartão vira hoje.', false, to_timestamp(1790120065000 / 1000.0)),
  ('rem_0mudb9mcdbw5gq9zy', 'clinic_demo', 'pat_6', '2026-09-27', 'Confirmar retorno da extração de siso.', false, to_timestamp(1790120065000 / 1000.0));

-- stock_items: 10 linhas
INSERT INTO "stock_items" ("id", "clinic_id", "name", "category", "unit", "quantity", "min_quantity", "supplier", "active", "created_at") VALUES
  ('stk_0mudb9mcglaqid0af', 'clinic_demo', 'Luva de procedimento M', 'Descartáveis', 'cx', 24, 10, 'Dental Cremer', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mcg6vtyp8v6', 'clinic_demo', 'Máscara cirúrgica tripla', 'Descartáveis', 'cx', 6, 8, 'Dental Cremer', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mch0r0qgunh', 'clinic_demo', 'Anestésico Lidocaína 2%', 'Anestésicos', 'cx', 12, 4, 'Dental Speed', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mchafyrali8', 'clinic_demo', 'Agulha gengival curta', 'Anestésicos', 'cx', 3, 5, 'Dental Speed', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mchbcif2wad', 'clinic_demo', 'Resina composta A2', 'Restauradores', 'un', 9, 4, 'Odonto Prime', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mchciqfcuny', 'clinic_demo', 'Ácido fosfórico 37%', 'Restauradores', 'un', 5, 3, 'Odonto Prime', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mcig6r2mihn', 'clinic_demo', 'Lima endodôntica sortida', 'Endodontia', 'kit', 7, 3, 'Dental Cremer', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mci0h86dq8j', 'clinic_demo', 'Sugador descartável', 'Descartáveis', 'cx', 0, 6, 'Dental Cremer', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mcibgjrl1fh', 'clinic_demo', 'Gaze estéril', 'Descartáveis', 'cx', 18, 8, 'Odonto Prime', true, to_timestamp(1790120065000 / 1000.0)),
  ('stk_0mudb9mcj17kg02dj', 'clinic_demo', 'Flúor gel neutro', 'Prevenção', 'un', 11, 5, 'Dental Speed', true, to_timestamp(1790120065000 / 1000.0));

-- stock_moves: 20 linhas
INSERT INTO "stock_moves" ("id", "clinic_id", "item_id", "kind", "quantity", "note", "user_id", "created_at") VALUES
  ('mov_0mudb9mcgvqopkoe2', 'clinic_demo', 'stk_0mudb9mcglaqid0af', 'in', 30, 'Compra do mês', 'user_admin', to_timestamp(1789083265120 / 1000.0)),
  ('mov_0mudb9mcgd66gzsfb', 'clinic_demo', 'stk_0mudb9mcglaqid0af', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265120 / 1000.0)),
  ('mov_0mudb9mchwxeo3pvq', 'clinic_demo', 'stk_0mudb9mcg6vtyp8v6', 'in', 12, 'Compra do mês', 'user_admin', to_timestamp(1789083265121 / 1000.0)),
  ('mov_0mudb9mch1fp7us5g', 'clinic_demo', 'stk_0mudb9mcg6vtyp8v6', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265121 / 1000.0)),
  ('mov_0mudb9mch179ttp49', 'clinic_demo', 'stk_0mudb9mch0r0qgunh', 'in', 18, 'Compra do mês', 'user_admin', to_timestamp(1789083265121 / 1000.0)),
  ('mov_0mudb9mchgdo8cnv1', 'clinic_demo', 'stk_0mudb9mch0r0qgunh', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265121 / 1000.0)),
  ('mov_0mudb9mchxuqycwwx', 'clinic_demo', 'stk_0mudb9mchafyrali8', 'in', 9, 'Compra do mês', 'user_admin', to_timestamp(1789083265121 / 1000.0)),
  ('mov_0mudb9mchscesn5v1', 'clinic_demo', 'stk_0mudb9mchafyrali8', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265121 / 1000.0)),
  ('mov_0mudb9mchm50gjwa2', 'clinic_demo', 'stk_0mudb9mchbcif2wad', 'in', 15, 'Compra do mês', 'user_admin', to_timestamp(1789083265121 / 1000.0)),
  ('mov_0mudb9mch6r7y3b91', 'clinic_demo', 'stk_0mudb9mchbcif2wad', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265121 / 1000.0)),
  ('mov_0mudb9mcip5o9p7sh', 'clinic_demo', 'stk_0mudb9mchciqfcuny', 'in', 11, 'Compra do mês', 'user_admin', to_timestamp(1789083265122 / 1000.0)),
  ('mov_0mudb9mci8abxwndw', 'clinic_demo', 'stk_0mudb9mchciqfcuny', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265122 / 1000.0)),
  ('mov_0mudb9mcifuen2qdw', 'clinic_demo', 'stk_0mudb9mcig6r2mihn', 'in', 13, 'Compra do mês', 'user_admin', to_timestamp(1789083265122 / 1000.0)),
  ('mov_0mudb9mcip4ik92u7', 'clinic_demo', 'stk_0mudb9mcig6r2mihn', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265122 / 1000.0)),
  ('mov_0mudb9mcid700q5pj', 'clinic_demo', 'stk_0mudb9mci0h86dq8j', 'in', 6, 'Compra do mês', 'user_admin', to_timestamp(1789083265122 / 1000.0)),
  ('mov_0mudb9mci1rkp6x1r', 'clinic_demo', 'stk_0mudb9mci0h86dq8j', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265122 / 1000.0)),
  ('mov_0mudb9mcjh2w9om23', 'clinic_demo', 'stk_0mudb9mcibgjrl1fh', 'in', 24, 'Compra do mês', 'user_admin', to_timestamp(1789083265123 / 1000.0)),
  ('mov_0mudb9mcjs2c8hnc1', 'clinic_demo', 'stk_0mudb9mcibgjrl1fh', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265123 / 1000.0)),
  ('mov_0mudb9mcjzlwl0u04', 'clinic_demo', 'stk_0mudb9mcj17kg02dj', 'in', 17, 'Compra do mês', 'user_admin', to_timestamp(1789083265123 / 1000.0)),
  ('mov_0mudb9mcj6wkdenfb', 'clinic_demo', 'stk_0mudb9mcj17kg02dj', 'out', 6, 'Uso no atendimento', 'user_recep', to_timestamp(1789947265123 / 1000.0));

-- lab_cases: 4 linhas
INSERT INTO "lab_cases" ("id", "clinic_id", "patient_id", "dentist_id", "lab", "work", "teeth", "status", "sent_on", "due_on", "returned_on", "cost_cents", "note", "created_at") VALUES
  ('lab_0mudb9mcjc9wdm6gn', 'clinic_demo', 'pat_4', 'user_rafael', 'Prótese Arte Dental', 'Coroa de porcelana sobre implante', '36', 'sent', '2026-09-16', '2026-09-24', NULL, 68000, 'Cor A2, modelo enviado junto.', to_timestamp(1790120065000 / 1000.0)),
  ('lab_0mudb9mcjmcunsimk', 'clinic_demo', 'pat_8', 'user_rafael', 'Prótese Arte Dental', 'Provisório em resina', '21, 22', 'sent', '2026-09-11', '2026-09-19', NULL, 24000, NULL, to_timestamp(1790120065000 / 1000.0)),
  ('lab_0mudb9mcjzgc74od3', 'clinic_demo', 'pat_10', 'user_helena', 'Lab Oral Design', 'Faceta de porcelana', '11, 12, 21, 22', 'returned', '2026-09-08', '2026-09-21', '2026-09-21', 152000, 'Conferir cor antes de cimentar.', to_timestamp(1790120065000 / 1000.0)),
  ('lab_0mudb9mcjgh36v977', 'clinic_demo', 'pat_2', 'user_helena', 'Lab Oral Design', 'Placa de bruxismo', 'Arcada superior', 'delivered', '2026-08-25', '2026-09-04', '2026-09-03', 45000, NULL, to_timestamp(1790120065000 / 1000.0));

-- iris_settings: 1 linha
INSERT INTO "iris_settings" ("clinic_id", "active", "tone", "greeting", "can_schedule", "answer_outside_hours", "away_message", "handoff_keywords", "max_ai_messages", "extra_instructions", "updated_at") VALUES
  ('clinic_demo', true, 'acolhedor', 'Oi! Sou a Íris, assistente virtual da Clínica Sorriso Vivo.', true, true, NULL, 'advogado, processo, reembolso, ouvidoria', 0, 'Estacionamento conveniado no prédio ao lado. A primeira avaliação é sempre com a Dra. Helena.', to_timestamp(1790120065120 / 1000.0));

COMMIT;

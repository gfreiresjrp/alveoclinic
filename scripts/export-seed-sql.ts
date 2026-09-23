/**
 * Exporta os dados de demonstração do SQLite antigo como SQL de Postgres.
 *
 * Existe porque a migração para o Supabase aconteceu com o banco local já
 * populado: em vez de reescrever o seed, traduzimos o que já estava lá. As
 * únicas diferenças reais entre os dois dialetos, para estes dados, são os
 * booleanos (0/1 contra true/false) e os instantes (milissegundos contra
 * timestamptz) — e as duas listas saem do próprio schema, não de memória.
 *
 * Roda com: npx tsx scripts/export-seed-sql.ts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DB = path.join(process.cwd(), "data", "alveo.db");
const SCHEMA = path.join(process.cwd(), "src", "db", "schema.ts");
const OUT = path.join(process.cwd(), "drizzle", "seed.sql");

/** Ordem de inserção: uma tabela só entra depois de quem ela referencia. */
const TABLES = [
  "clinics",
  "users",
  "chairs",
  "procedures",
  "patients",
  "appointments",
  "tooth_records",
  "treatment_plans",
  "treatment_items",
  "clinical_notes",
  "finance_entries",
  "conversations",
  "messages",
  "campaigns",
  "campaign_sends",
  "patient_reminders",
  "payments",
  "documents",
  "stock_items",
  "stock_moves",
  "lab_cases",
  "iris_settings",
];

const schema = readFileSync(SCHEMA, "utf8");
const booleanCols = new Set([...schema.matchAll(/boolean\("([a-z_]+)"\)/g)].map((m) => m[1]));
const timestampCols = new Set(
  [...schema.matchAll(/timestamp\("([a-z_]+)"/g)].map((m) => m[1]),
);

function quote(value: unknown, column: string) {
  if (value === null || value === undefined) return "NULL";

  if (booleanCols.has(column)) return value ? "true" : "false";

  if (timestampCols.has(column)) {
    // No SQLite eram milissegundos desde a época.
    return `to_timestamp(${Number(value)} / 1000.0)`;
  }

  if (typeof value === "number") return String(value);

  return `'${String(value).replace(/'/g, "''")}'`;
}

const linhas: string[] = [
  "-- Dados de demonstração da Alveo Clinic.",
  "-- Gerado por scripts/export-seed-sql.ts a partir do banco local.",
  "-- Aplique DEPOIS da migração 0000_dapper_silk_fever.sql.",
  "",
  "BEGIN;",
  "",
];

let total = 0;

for (const table of TABLES) {
  const json = execFileSync("sqlite3", ["-json", DB, `select * from ${table};`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

  const rows: Record<string, unknown>[] = json ? JSON.parse(json) : [];
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const values = rows
    .map((row) => `  (${columns.map((c) => quote(row[c], c)).join(", ")})`)
    .join(",\n");

  linhas.push(
    `-- ${table}: ${rows.length} ${rows.length === 1 ? "linha" : "linhas"}`,
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES`,
    `${values};`,
    "",
  );
  total += rows.length;
}

linhas.push("COMMIT;", "");
writeFileSync(OUT, linhas.join("\n"), "utf8");

console.log(`${OUT}`);
console.log(`${total} linhas em ${TABLES.length} tabelas`);
console.log(`booleanos: ${[...booleanCols].join(", ")}`);
console.log(`instantes: ${[...timestampCols].join(", ")}`);

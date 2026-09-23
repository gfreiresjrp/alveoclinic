import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Para `db:push` use a connection string DIRETA do Supabase (porta 5432).
    // O pooler da 6543 não serve para DDL.
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

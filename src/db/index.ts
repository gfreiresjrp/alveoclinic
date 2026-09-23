import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Conexão com o Postgres do Supabase.
 *
 * É preguiçosa de propósito: abrir a conexão no topo do módulo quebra o
 * `next build`, que importa cada rota para coletar configuração e faria isso
 * numa máquina sem banco. Com o proxy abaixo ela só nasce na primeira consulta
 * de verdade — em build nenhuma acontece.
 *
 * Use a string do **transaction pooler** do Supabase (porta 6543) em produção:
 * cada invocação serverless é curta, e o pooler é quem aguenta o vai e vem.
 * Por isso `prepare: false` (o pgbouncer em modo transaction não suporta
 * prepared statements) e `max: 1` (uma conexão por invocação).
 */

let instance: PostgresJsDatabase<typeof schema> | null = null;

function connection() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL não configurada. Use a connection string do Supabase (pooler, porta 6543).",
      );
    }
    const client = postgres(url, { prepare: false, max: 1 });
    instance = drizzle(client, { schema });
  }
  return instance;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const real = connection();
    const value = Reflect.get(real, prop, real);
    // Os métodos do drizzle dependem do próprio `this`, então vão amarrados.
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };

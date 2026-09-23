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
        "DATABASE_URL não configurada. Copie em Supabase -> Connect -> URI -> Transaction pooler.",
      );
    }
    // Um erro de conexão por string pela metade some dentro de um "server
    // error" genérico e custa um deploy inteiro para descobrir. Estes três
    // casos são os que acontecem de verdade ao montar a string à mão.
    const marcadores = ["REGIAO", "YOUR-PASSWORD", "[", "SENHA@", "<"];
    const encontrado = marcadores.find((m) => url.includes(m));
    if (encontrado) {
      throw new Error(
        `DATABASE_URL ainda tem um trecho de exemplo ("${encontrado}"). Copie a string inteira em Supabase -> Connect -> URI -> Transaction pooler e troque só a senha.`,
      );
    }
    if (url.startsWith("file:")) {
      throw new Error(
        "DATABASE_URL aponta para um arquivo SQLite. O banco agora é Postgres no Supabase.",
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

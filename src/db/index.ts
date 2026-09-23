import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Conexão preguiçosa.
 *
 * Abrir o banco no topo do módulo quebra o `next build`: para coletar a
 * configuração das rotas o Next importa cada arquivo, o que abriria o banco
 * numa máquina de CI onde `data/` não existe. Com o proxy abaixo a conexão só
 * nasce na primeira consulta de verdade — em build nenhuma acontece.
 */

let instance: LibSQLDatabase<typeof schema> | null = null;

function connection() {
  if (!instance) {
    const client = createClient({
      url: process.env.DATABASE_URL ?? "file:./data/alveo.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    instance = drizzle(client, { schema });
  }
  return instance;
}

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    const real = connection();
    const value = Reflect.get(real, prop, real);
    // Os métodos do drizzle dependem do próprio `this`, então vão amarrados.
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };

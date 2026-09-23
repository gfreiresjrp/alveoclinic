import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Diagnóstico TEMPORÁRIO da conexão com o banco.
 *
 * Existe só para descobrir por que o login falha em produção, onde não dá para
 * ler o stack. Devolve o código do erro do Postgres e o host/porta da conexão
 * — nada de senha, usuário ou connection string. Remover depois de resolver.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL;

  const env = {
    DATABASE_URL: Boolean(url),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  let alvo: {
    protocolo: string;
    host: string;
    porta: string;
    usuario: string;
    temSenha: boolean;
  } | null = null;
  if (url) {
    try {
      const u = new URL(url);
      alvo = {
        protocolo: u.protocol,
        host: u.hostname,
        porta: u.port || "(padrão)",
        // No pooler o usuário é postgres.<project_ref>, não só "postgres".
        usuario: u.username,
        // Só se existe; o valor nunca sai daqui.
        temSenha: Boolean(u.password) && !u.password.includes("YOUR-PASSWORD"),
      };
    } catch {
      alvo = {
        protocolo: "?",
        host: "(url inválida)",
        porta: "?",
        usuario: "?",
        temSenha: false,
      };
    }
  }

  try {
    const [row] = await db.select({ n: count() }).from(users);
    return NextResponse.json({ ok: true, env, alvo, usuarios: row.n });
  } catch (erro) {
    const e = erro as {
      code?: string;
      name?: string;
      routine?: string;
      message?: string;
    };
    // A mensagem só é repassada quando é uma validação nossa — as do driver
    // podem trazer pedaços da connection string.
    const nossa = e.message?.startsWith("DATABASE_URL") ? e.message : null;
    return NextResponse.json(
      {
        ok: false,
        env,
        alvo,
        erro: { code: e.code ?? null, name: e.name ?? null, routine: e.routine ?? null },
        aviso: nossa,
      },
      { status: 500 },
    );
  }
}

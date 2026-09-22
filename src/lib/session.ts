import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clinics, users } from "@/db/schema";
import { SESSION_COOKIE, readSessionToken } from "./auth";

/** Usuário logado + clínica dele, ou null. */
export async function getSession() {
  const store = await cookies();
  const userId = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const [row] = await db
    .select({ user: users, clinic: clinics })
    .from(users)
    .innerJoin(clinics, eq(clinics.id, users.clinicId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || !row.user.active) return null;
  return row;
}

/** Igual a getSession, mas manda para o login quando não há sessão. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sistema/entrar");
  return session;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

type State = { error: string; email?: string };

export async function login(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/sistema");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Mensagem única para não revelar se o e-mail existe.
  const invalid = { error: "E-mail ou senha incorretos.", email };
  if (!user || !user.active) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(user.id), sessionCookieOptions);

  redirect(redirectTo.startsWith("/sistema") ? redirectTo : "/sistema");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/sistema/entrar");
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { irisSettings } from "@/db/schema";
import { requireSession } from "@/lib/session";
import type { IrisTone } from "@/lib/iris";

const TONES: IrisTone[] = ["acolhedor", "direto", "formal"];

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export async function saveIrisSettings(form: FormData) {
  const { clinic } = await requireSession();

  const tone = String(form.get("tone") ?? "acolhedor");
  const max = Number(form.get("maxAiMessages") ?? 0);

  if (!TONES.includes(tone as IrisTone)) {
    return { ok: false as const, error: "Tom inválido." };
  }
  if (!Number.isFinite(max) || max < 0 || max > 50) {
    return { ok: false as const, error: "O limite de respostas vai de 0 a 50." };
  }

  const values = {
    active: form.get("active") === "on",
    tone: tone as IrisTone,
    greeting: texto(form, "greeting"),
    canSchedule: form.get("canSchedule") === "on",
    answerOutsideHours: form.get("answerOutsideHours") === "on",
    awayMessage: texto(form, "awayMessage"),
    handoffKeywords: texto(form, "handoffKeywords"),
    maxAiMessages: Math.trunc(max),
    extraInstructions: texto(form, "extraInstructions"),
    updatedAt: new Date(),
  };

  // Uma linha por clínica: insere na primeira vez, atualiza depois.
  await db
    .insert(irisSettings)
    .values({ clinicId: clinic.id, ...values })
    .onConflictDoUpdate({ target: irisSettings.clinicId, set: values });

  revalidatePath("/sistema/iris");
  return { ok: true as const };
}

/** Liga/desliga direto do cabeçalho, sem passar pelo formulário inteiro. */
export async function toggleIris(active: boolean) {
  const { clinic } = await requireSession();

  await db
    .insert(irisSettings)
    .values({ clinicId: clinic.id, active, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: irisSettings.clinicId,
      set: { active, updatedAt: new Date() },
    });

  revalidatePath("/sistema/iris");
  return { ok: true as const };
}

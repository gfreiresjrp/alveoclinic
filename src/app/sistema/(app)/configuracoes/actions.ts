"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clinics, procedures } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { newId } from "@/lib/id";
import { toMinutes } from "@/lib/format";

export type SettingsState = { error?: string; ok?: boolean };

function onlyAdmin(role: string) {
  return role === "admin";
}

export async function updateClinic(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { clinic, user } = await requireSession();
  if (!onlyAdmin(user.role)) return { error: "Só o administrador pode alterar a clínica." };

  const opening = toMinutes(String(formData.get("opening") ?? "08:00"));
  const closing = toMinutes(String(formData.get("closing") ?? "19:00"));
  if (closing <= opening) return { error: "O fechamento tem que ser depois da abertura." };

  await db
    .update(clinics)
    .set({
      name: String(formData.get("name") ?? "").trim() || clinic.name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      croResponsible: String(formData.get("cro") ?? "").trim() || null,
      openingMin: opening,
      closingMin: closing,
      slotMin: Number(formData.get("slot") ?? 30),
    })
    .where(eq(clinics.id, clinic.id));

  revalidatePath("/sistema/configuracoes");
  revalidatePath("/sistema/agenda");
  return { ok: true };
}

export async function createProcedure(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { clinic, user } = await requireSession();
  if (!onlyAdmin(user.role)) return { error: "Só o administrador pode alterar a tabela." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Informe o nome do procedimento." };

  const price = Math.round(Number(String(formData.get("price") ?? "0").replace(",", ".")) * 100);
  const duration = Number(formData.get("duration") ?? 30);

  await db.insert(procedures).values({
    id: newId("proc_"),
    clinicId: clinic.id,
    name,
    specialty: String(formData.get("specialty") ?? "").trim() || null,
    code: null,
    durationMin: Number.isFinite(duration) && duration > 0 ? duration : 30,
    priceCents: Number.isFinite(price) && price > 0 ? price : 0,
    perTooth: formData.get("perTooth") === "on",
    active: true,
  });

  revalidatePath("/sistema/configuracoes");
  return { ok: true };
}

export async function toggleProcedure(id: string, active: boolean) {
  const { clinic, user } = await requireSession();
  if (!onlyAdmin(user.role)) return;

  await db
    .update(procedures)
    .set({ active })
    .where(and(eq(procedures.clinicId, clinic.id), eq(procedures.id, id)));

  revalidatePath("/sistema/configuracoes");
}

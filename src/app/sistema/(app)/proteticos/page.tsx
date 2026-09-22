import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { labCases, patients, users } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { getDentists, searchPatients } from "@/lib/queries";
import { isoDate } from "@/lib/format";
import { LabBoard } from "./LabBoard";

export const metadata: Metadata = { title: "Protéticos", robots: { index: false } };

export default async function ProteticosPage() {
  const { clinic } = await requireSession();

  const [cases, dentists, patientRows] = await Promise.all([
    db
      .select({
        id: labCases.id,
        lab: labCases.lab,
        work: labCases.work,
        teeth: labCases.teeth,
        status: labCases.status,
        sentOn: labCases.sentOn,
        dueOn: labCases.dueOn,
        returnedOn: labCases.returnedOn,
        costCents: labCases.costCents,
        note: labCases.note,
        patientId: patients.id,
        patientName: patients.name,
        dentistName: users.name,
      })
      .from(labCases)
      .innerJoin(patients, eq(patients.id, labCases.patientId))
      .innerJoin(users, eq(users.id, labCases.dentistId))
      .where(eq(labCases.clinicId, clinic.id))
      .orderBy(desc(labCases.sentOn)),

    getDentists(clinic.id),
    searchPatients(clinic.id, ""),
  ]);

  return (
    <LabBoard
      today={isoDate(new Date())}
      cases={cases}
      dentists={dentists.map((d) => ({ id: d.id, name: d.name }))}
      patients={patientRows.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}

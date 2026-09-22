import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import {
  getAppointments,
  getChairs,
  getDentists,
  getProcedures,
  searchPatients,
} from "@/lib/queries";
import { addDays, isoDate, monthMatrix, startOfWeek, weekdayOf } from "@/lib/format";
import { AgendaScreen } from "./AgendaScreen";

export const metadata: Metadata = { title: "Agenda", robots: { index: false } };

type Params = {
  semana?: string;
  dia?: string;
  vista?: string;
  dentistas?: string;
  cadeira?: string;
  status?: string;
  q?: string;
  /** Dias da semana escondidos: "sab", "dom" ou "sab,dom". */
  ocultar?: string;
};

/** Nome do parâmetro → índice de Date.getDay(). */
const HIDEABLE: Record<string, number> = { sab: 6, dom: 0 };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { clinic } = await requireSession();
  const params = await searchParams;

  const today = isoDate(new Date());
  const view = params.vista === "dia" ? "dia" : params.vista === "mes" ? "mes" : "semana";
  const day = params.dia ?? today;
  const weekStart = startOfWeek(params.semana ?? today);

  // Cada visão busca só o intervalo que exibe. A semana vai de segunda a
  // domingo — o consultório abre aos sábados e pode ter plantão no domingo.
  const weeks = monthMatrix(day);
  const from = view === "dia" ? day : view === "mes" ? weeks[0][0] : weekStart;
  const to =
    view === "dia" ? day : view === "mes" ? weeks[5][6] : addDays(weekStart, 6);

  const [items, dentists, procs, chairRows, patientRows] = await Promise.all([
    getAppointments(clinic.id, from, to),
    getDentists(clinic.id),
    getProcedures(clinic.id),
    getChairs(clinic.id),
    searchPatients(clinic.id, ""),
  ]);

  const selectedDentists = (params.dentistas ?? "").split(",").filter(Boolean);
  const term = (params.q ?? "").trim().toLowerCase();

  const hiddenDays = (params.ocultar ?? "")
    .split(",")
    .filter((d) => d in HIDEABLE);
  const hiddenWeekdays = hiddenDays.map((d) => HIDEABLE[d]);

  const filtered = items.filter((a) => {
    if (hiddenWeekdays.includes(weekdayOf(a.date))) return false;
    if (selectedDentists.length > 0 && !selectedDentists.includes(a.dentistId)) return false;
    if (params.cadeira && a.chairName !== params.cadeira) return false;
    if (params.status && a.status !== params.status) return false;
    if (term && !a.patientName.toLowerCase().includes(term)) return false;
    return true;
  });

  return (
    <AgendaScreen
      view={view}
      weekStart={weekStart}
      day={day}
      today={today}
      total={items.length}
      appointments={filtered}
      dentists={dentists.map((d) => ({ id: d.id, name: d.name, color: d.color }))}
      selectedDentists={selectedDentists}
      hiddenDays={hiddenDays}
      chairFilter={params.cadeira ?? ""}
      statusFilter={params.status ?? ""}
      search={params.q ?? ""}
      procedures={procs.map((p) => ({ id: p.id, name: p.name, durationMin: p.durationMin }))}
      chairs={chairRows.map((c) => ({ id: c.id, name: c.name }))}
      patients={patientRows.map((p) => ({ id: p.id, name: p.name }))}
      hours={{ from: clinic.openingMin, to: clinic.closingMin, slot: clinic.slotMin }}
    />
  );
}

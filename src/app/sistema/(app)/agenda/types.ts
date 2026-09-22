export type Appointment = {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  status: string;
  source: string;
  notes: string | null;
  reason: string | null;
  statusNote: string | null;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  dentistColor: string;
  procedureName: string | null;
  chairName: string | null;
};

export type Option = { id: string; name: string };
export type Dentist = Option & { color: string };

/** Uma coluna da grade: um dia (semana) ou um dentista (dia). */
export type Column = { key: string; date: string; title: string; dentistId?: string };

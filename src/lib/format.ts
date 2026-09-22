/** Centavos → "R$ 1.234,56" */
export function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Minutos desde a meia-noite → "14:30" */
export function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** "14:30" → minutos desde a meia-noite */
export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Date → "YYYY-MM-DD" no fuso local (não em UTC). */
export function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date local (evita o shift de fuso do construtor com string). */
export function fromIsoDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value: string, days: number) {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(value: string) {
  const date = fromIsoDate(value);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return isoDate(date);
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function weekdayShort(value: string) {
  return WEEKDAYS[fromIsoDate(value).getDay()];
}

export function dayNumber(value: string) {
  return fromIsoDate(value).getDate();
}

/** "2026-09-22" → "22 de setembro de 2026" */
export function longDate(value: string) {
  const d = fromIsoDate(value);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "2026-09-22" → "22/09/2026" */
export function shortDate(value: string) {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

export function phoneMask(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export function age(birthDate: string | null) {
  if (!birthDate) return null;
  const b = fromIsoDate(birthDate);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  return years;
}

/** Primeiro e último dia do mês deslocado em `offset` meses a partir de hoje. */
export function monthRange(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: isoDate(first), to: isoDate(last) };
}

/** Variação percentual arredondada; null quando não há base de comparação. */
export function percentChange(current: number, previous: number) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const PERIODS = [
  { until: 12, label: "Bom dia" },
  { until: 18, label: "Boa tarde" },
];

export function greeting(date = new Date()) {
  const hour = date.getHours();
  return PERIODS.find((p) => hour < p.until)?.label ?? "Boa noite";
}

/** "terça-feira, 22 de setembro" */
export function weekdayLongDate(value: string) {
  const d = fromIsoDate(value);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "Setembro de 2026" — o título que fica no topo da agenda. */
export function monthTitle(value: string) {
  const d = fromIsoDate(value);
  const name = MONTH_NAMES[d.getMonth()];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${d.getFullYear()}`;
}

export function startOfMonth(value: string) {
  const d = fromIsoDate(value);
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(value: string) {
  const d = fromIsoDate(value);
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(value: string, months: number) {
  const d = fromIsoDate(value);
  // Dia 1 antes de somar: evita 31/01 + 1 mês virar 03/03.
  return isoDate(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** As 6 semanas que cobrem o mês, cada uma com 7 dias (segunda a domingo). */
export function monthMatrix(value: string) {
  const first = startOfWeek(startOfMonth(value));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

/** Minutos desde a meia-noite, agora. */
export function minutesNow(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

/** Dia da semana da data (0 = domingo, 6 = sábado), no fuso local. */
export function weekdayOf(value: string) {
  return fromIsoDate(value).getDay();
}

/** "29 anos e 11 meses" — a idade como a recepção lê em voz alta. */
export function ageLong(birthDate: string | null) {
  if (!birthDate) return null;
  const nascimento = fromIsoDate(birthDate);
  const hoje = new Date();

  let anos = hoje.getFullYear() - nascimento.getFullYear();
  let meses = hoje.getMonth() - nascimento.getMonth();
  if (hoje.getDate() < nascimento.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  if (meses === 0) return parteAnos;
  return `${parteAnos} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

/** Dias até o próximo aniversário (0 = hoje). */
export function daysToBirthday(birthDate: string | null, today = isoDate(new Date())) {
  if (!birthDate) return null;
  const [ano] = today.split("-").map(Number);
  const mesDia = birthDate.slice(5);

  for (const candidato of [`${ano}-${mesDia}`, `${ano + 1}-${mesDia}`]) {
    const diff = Math.round(
      (fromIsoDate(candidato).getTime() - fromIsoDate(today).getTime()) / 86400000,
    );
    if (diff >= 0) return diff;
  }
  return null;
}

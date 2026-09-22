import Image from "next/image";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel p-5 ${className}`}>{children}</div>;
}

/** Saudação do topo: nome em destaque, data logo abaixo, nada mais. */
export function GreetingHeader({ title, date }: { title: string; date: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">{date}</p>
    </div>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  /** Variação percentual contra o mês anterior; null quando não há base. */
  delta?: number | null;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const tones = {
    default: "text-slate-900",
    positive: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  };

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className="icon-badge shrink-0">{icon}</span>}
      </div>

      <p className={`font-display mt-3 text-[1.75rem] font-bold leading-none ${tones[tone]}`}>
        {value}
      </p>

      {delta !== undefined && <Delta value={delta} />}
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Variação contra o mês anterior. Sem base de comparação, mostra um traço. */
function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
        <span className="text-emerald-600">—</span> vs. mês anterior
      </p>
    );
  }

  const up = value >= 0;
  return (
    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
      <span className={up ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
        {up ? "▲" : "▼"} {Math.abs(value)}%
      </span>
      vs. mês anterior
    </p>
  );
}

const statusStyles: Record<string, string> = {
  scheduled: "border-slate-200 bg-slate-50 text-slate-600",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  arrived: "border-violet-200 bg-violet-50 text-violet-700",
  rescheduled: "border-amber-200 bg-amber-50 text-amber-700",
  attended: "border-emerald-200 bg-emerald-50 text-emerald-700",
  noshow: "border-rose-200 bg-rose-50 text-rose-700",
  canceled: "border-slate-200 bg-slate-50 text-slate-400",
  ai: "border-accent-line bg-accent-soft text-accent-strong",
  human: "border-amber-200 bg-amber-50 text-amber-700",
  closed: "border-slate-200 bg-slate-50 text-slate-500",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  due: "border-amber-200 bg-amber-50 text-amber-700",
  partial: "border-sky-200 bg-sky-50 text-sky-700",
  late: "border-rose-200 bg-rose-50 text-rose-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function Tag({
  children,
  tone = "scheduled",
}: {
  children: ReactNode;
  tone?: keyof typeof statusStyles | string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${
        statusStyles[tone] ?? statusStyles.scheduled
      }`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  text,
  icon,
  art,
}: {
  title: string;
  text?: string;
  icon?: ReactNode;
  /** Caminho de uma ilustração em public/illustrations — tem prioridade sobre o ícone. */
  art?: string;
}) {
  return (
    <div className="px-6 py-10 text-center">
      {art ? (
        <Image
          src={art}
          alt=""
          width={260}
          height={160}
          unoptimized
          className="mx-auto mb-5 h-28 w-auto opacity-90"
        />
      ) : (
        icon && (
          <span className="mx-auto mb-4 grid h-10 w-10 place-items-center text-slate-300">
            {icon}
          </span>
        )
      )}
      <p className="font-display text-base font-semibold text-slate-700">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-400">{text}</p>}
    </div>
  );
}

/** Casca dos diálogos do sistema. */
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const APPOINTMENT_STATUS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  arrived: "Na recepção",
  attended: "Atendido",
  noshow: "Faltou",
  rescheduled: "Remarcou",
  canceled: "Cancelado",
};

/** Cor que o card do paciente ganha na grade conforme o status. */
export const APPOINTMENT_ACCENT: Record<string, string> = {
  arrived: "#7c3aed",
  attended: "#059669",
  noshow: "#e11d48",
  rescheduled: "#d97706",
};

export const SOURCE_LABEL: Record<string, string> = {
  staff: "Recepção",
  ai: "Íris",
  online: "Site",
};

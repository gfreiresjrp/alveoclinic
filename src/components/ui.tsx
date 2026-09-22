import Link from "next/link";
import { IconArrowRight } from "./Icons";

type CtaProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  withArrow?: boolean;
  target?: string;
  rel?: string;
};

const styles = {
  primary:
    "bg-lime text-navy hover:bg-lime-bright shadow-[0_10px_30px_-8px_rgba(198,227,26,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(198,227,26,0.7)]",
  secondary:
    "bg-white/5 text-white border border-white/15 hover:border-lime/60 hover:bg-white/10",
  ghost: "text-white/80 hover:text-white",
};

export function Cta({
  href,
  children,
  variant = "primary",
  className = "",
  withArrow = false,
  target,
  rel,
}: CtaProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime cursor-pointer ${styles[variant]} ${className}`}
    >
      {children}
      {withArrow && (
        <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      )}
    </Link>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-lime sm:text-xs sm:tracking-[0.18em]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime animate-pulse" />
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-lime">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-display mt-3 text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>
      )}
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`py-20 sm:py-28 ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

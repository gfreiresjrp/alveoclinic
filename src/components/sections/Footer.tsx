import Link from "next/link";
import { Logo } from "../Logo";
import { IconWhatsApp } from "../Icons";
import { nav, site, whatsappHref } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-14">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="max-w-sm">
            <Link href="/" className="text-2xl" aria-label={site.brand}>
              <Logo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {site.tagline}. Atendimento, agenda, prontuário e financeiro no mesmo
              lugar.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-lime transition-opacity hover:opacity-80"
            >
              <IconWhatsApp className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <p className="font-display text-sm font-semibold text-white">Navegar</p>
              <ul className="mt-4 space-y-2.5">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted transition-colors hover:text-lime"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-display text-sm font-semibold text-white">Plataforma</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href={site.appUrl}
                    className="text-sm text-muted transition-colors hover:text-lime"
                  >
                    Entrar no sistema
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-sm text-muted transition-colors hover:text-lime">
                    Política de privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="text-sm text-muted transition-colors hover:text-lime">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-sm text-muted transition-colors hover:text-lime"
                  >
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.brand}. Todos os direitos reservados.
          </p>
          <p>
            A {site.ai} é uma assistente virtual e não substitui avaliação profissional.
          </p>
        </div>
      </div>
    </footer>
  );
}

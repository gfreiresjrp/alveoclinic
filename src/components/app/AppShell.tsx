"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import { LogoSymbol } from "../Logo";
import {
  IconGrid,
  IconChat,
  IconCalendar,
  IconIdCard,
  IconMoney,
  IconMegaphone,
  IconChart,
  IconPill,
  IconRecord,
  IconSettings,
  IconRobot,
  IconBell,
  IconLogout,
  IconMenu,
  IconClose,
} from "../Icons";
import { logout } from "@/app/sistema/entrar/actions";
import { ThemeToggle } from "./ThemeToggle";
import { initials } from "@/lib/format";
import { site } from "@/lib/site";

const links = [
  { href: "/sistema", label: "Visão geral", icon: IconGrid, exact: true },
  { href: "/sistema/conversas", label: "Conversas", icon: IconChat, exact: false },
  { href: "/sistema/agenda", label: "Agenda", icon: IconCalendar, exact: false },
  { href: "/sistema/pacientes", label: "Pacientes", icon: IconIdCard, exact: false },
  { href: "/sistema/financeiro", label: "Financeiro", icon: IconMoney, exact: false },
  { href: "/sistema/campanhas", label: "Campanhas", icon: IconMegaphone, exact: false },
  { href: "/sistema/relatorios", label: "Relatórios", icon: IconChart, exact: false },
  { href: "/sistema/estoque", label: "Estoque", icon: IconPill, exact: false },
  { href: "/sistema/proteticos", label: "Protéticos", icon: IconRecord, exact: false },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  reception: "Recepção",
};

/**
 * Contagens dos badges. Chega como promessa de propósito: o layout do servidor
 * não a aguarda, então a tela pedida renderiza sem esperar as seis consultas
 * que montam a central de avisos. Os pontinhos aparecem depois, em streaming.
 */
export type Badges = Promise<{ conversations: number; notifications: number }>;

export function AppShell({
  user,
  badges,
  children,
}: {
  user: { name: string; role: string };
  badges: Badges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const [railHover, setRailHover] = useState(false);
  // O rodapé (sino e conta) não abre o trilho — só o bloco de navegação.
  // Mas se já estiver aberto, descer até o rodapé não fecha: o colapso só
  // acontece quando o mouse sai do <aside> inteiro. Clicar na conta também
  // não abre: o popover mora fora do <aside> (que tem overflow hidden) e é
  // ancorado ao lado do trilho.
  const railOpen = railHover;

  // Telas que gerenciam a própria rolagem e ocupam a janela inteira.
  const fullBleed = ["/sistema/conversas", "/sistema/agenda"].some((route) =>
    pathname.startsWith(route),
  );

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  /*
   * O trilho navega por JS, não com <a href>. O motivo é a barra de status do
   * navegador, que mostra a URL no canto inferior toda vez que o mouse passa
   * por um link — não há como desligá-la pela página. O prefetch no hover
   * mantém a navegação tão rápida quanto a do <Link>.
   */
  function railNav(href: string) {
    return {
      onClick: () => router.push(href),
      onMouseEnter: () => router.prefetch(href),
    };
  }

  /*
   * O sino aparece duas vezes (trilho e topo do celular) e em dois momentos:
   * primeiro sem contagem, como fallback do Suspense, e depois com ela. Por
   * isso a marcação mora numa função só — o fallback e o resultado nunca
   * saem de sincronia.
   */
  function railBell(count: number) {
    return (
      <button
        type="button"
        {...railNav("/sistema/notificacoes")}
        aria-label={count > 0 ? `${count} avisos na clínica` : "Notificações"}
        data-active={isActive("/sistema/notificacoes")}
        className="rail-item cursor-pointer"
      >
        <span className="rail-icon">
          <IconBell className="h-[19px] w-[19px]" />
          {count > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </span>
        <span className="rail-label">Notificações</span>
      </button>
    );
  }

  function topBell(count: number) {
    return (
      <Link
        href="/sistema/notificacoes"
        aria-label={count > 0 ? `${count} avisos na clínica` : "Notificações"}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:text-accent"
      >
        <IconBell className="h-[17px] w-[17px]" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        )}
      </Link>
    );
  }

  const rail = (
    <>
      <div
        className="rail-expander -mx-[14px] -mt-4 flex flex-1 flex-col px-[14px] pt-4"
        onMouseEnter={() => setRailHover(true)}
      >
      <button
        type="button"
        {...railNav("/sistema")}
        aria-label={site.brand}
        className="rail-logo mb-8 flex h-10 w-full cursor-pointer items-center"
      >
        <span className="rail-icon rail-logo-symbol">
          <LogoSymbol className="h-[23px] w-[23px] text-white" />
        </span>
        <Image
          src="/brand/alveo-wordmark.png"
          alt=""
          width={525}
          height={63}
          priority
          className="rail-logo-word"
        />
      </button>

      <div className="flex flex-col gap-1.5">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <button
            key={href}
            type="button"
            {...railNav(href)}
            aria-label={label}
            aria-current={isActive(href, exact) ? "page" : undefined}
            data-active={isActive(href, exact)}
            className="rail-item cursor-pointer"
          >
            <span className="rail-icon">
              <Icon className="h-[19px] w-[19px]" />
              {href === "/sistema/conversas" && (
                <Suspense fallback={null}>
                  <Dot badges={badges} field="conversations" />
                </Suspense>
              )}
            </span>
            <span className="rail-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="my-4 h-px w-full bg-white/15" />

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          {...railNav("/sistema/iris")}
          aria-label="Íris"
          data-active={isActive("/sistema/iris")}
          className="rail-item cursor-pointer"
        >
          <span className="rail-icon">
            <IconRobot className="h-[19px] w-[19px]" />
          </span>
          <span className="rail-label">Íris</span>
        </button>
      </div>
      </div>

      {/* Rodapé: fora do gatilho de propósito — passar o mouse aqui não abre. */}
      <div className="flex flex-col gap-1.5">
        <Suspense fallback={railBell(0)}>
          <Resolved badges={badges} field="notifications" render={railBell} />
        </Suspense>

        <button
          type="button"
          onClick={() => setAccount((v) => !v)}
          aria-label="Conta"
          aria-expanded={account}
          className="rail-item cursor-pointer"
        >
          <span className="rail-icon">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[11px] font-bold text-white/80">
              {initials(user.name)}
            </span>
          </span>
          <span className="rail-label truncate text-left">{user.name}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell min-h-screen">
      {/* trilho lateral (desktop) */}
      {/*
        O trilho expande por cima do conteúdo (nada de empurrar o layout) e fica
        aberto enquanto o popover da conta estiver visível, senão ele fecharia
        debaixo do mouse a caminho do popover.
      */}
      <aside
        data-open={railOpen}
        onMouseLeave={() => setRailHover(false)}
        className={`app-rail fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-rail px-[14px] py-4 transition-[width,box-shadow] duration-200 ease-out lg:flex ${
          railOpen ? "w-[232px] shadow-2xl shadow-black/20" : "w-[68px]"
        }`}
      >
        {rail}

      </aside>

      {account && (
          <>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setAccount(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div
              className={`fixed bottom-4 z-50 hidden w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-xl transition-[left] duration-200 ease-out lg:block ${
                railOpen ? "left-[240px]" : "left-[76px]"
              }`}
            >
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <ThemeToggle />

                <button
                  type="button"
                  onClick={() => {
                    setAccount(false);
                    router.push("/sistema/configuracoes");
                  }}
                  onMouseEnter={() => router.prefetch("/sistema/configuracoes")}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-100 ${
                    isActive("/sistema/configuracoes")
                      ? "font-medium text-accent"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <IconSettings className="h-4 w-4" />
                  Configurações
                </button>

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <IconLogout className="h-4 w-4" />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </>
      )}

      <div className="lg:pl-[68px]">
        {/* barra superior */}
        <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600"
            >
              {menu ? <IconClose className="h-[18px] w-[18px]" /> : <IconMenu className="h-[18px] w-[18px]" />}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Suspense fallback={topBell(0)}>
                <Resolved badges={badges} field="notifications" render={topBell} />
              </Suspense>

              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                aria-label="Conta"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600"
              >
                {initials(user.name)}
              </button>
            </div>
          </div>

          {menu && (
            <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-0.5 lg:hidden">
                {links.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenu(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      isActive(href, exact)
                        ? "bg-accent-soft font-semibold text-accent"
                        : "font-medium text-slate-600"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-100 pt-3 lg:mt-0 lg:border-t-0 lg:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/sistema/configuracoes"
                    onClick={() => setMenu(false)}
                    className="btn btn-secondary"
                  >
                    <IconSettings className="h-4 w-4" />
                    Configurações
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="btn btn-secondary">
                      <IconLogout className="h-4 w-4" />
                      Sair
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* A tela de conversas ocupa a janela inteira, sem respiro nem largura máxima. */}
        {fullBleed ? (
          <main className="pt-[var(--app-header)]">{children}</main>
        ) : (
          <main className="px-4 pb-8 pt-[calc(var(--app-header)+1.25rem)] sm:px-6 sm:pt-[calc(var(--app-header)+1.75rem)]">
            {children}
          </main>
        )}
      </div>
    </div>
  );
}

/** Pontinho vermelho que só existe depois que a contagem chega. */
function Dot({ badges, field }: { badges: Badges; field: "conversations" | "notifications" }) {
  return use(badges)[field] > 0 ? (
    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
  ) : null;
}

/** Espera a contagem e entrega ao mesmo desenho usado no fallback. */
function Resolved({
  badges,
  field,
  render,
}: {
  badges: Badges;
  field: "conversations" | "notifications";
  render: (count: number) => React.ReactNode;
}) {
  return render(use(badges)[field]);
}

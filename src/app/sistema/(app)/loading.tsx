"use client";

import { usePathname } from "next/navigation";

/*
 * Esqueleto de carregamento de todas as telas do sistema.
 *
 * Um único arquivo neste nível cobre todas as rotas abaixo: é a fronteira de
 * Suspense que o Next usa em qualquer navegação do trilho. Sem ele, o clique
 * ficava mudo até a última consulta do banco voltar — a tela antiga congelada,
 * sem nenhum sinal de que algo estava acontecendo.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-bar ${className}`} />;
}

export default function Loading() {
  const pathname = usePathname();
  // As telas que gerenciam a própria rolagem não ganham respiro do <main>,
  // então o esqueleto traz o seu. Mesma regra do AppShell.
  const fullBleed = ["/sistema/conversas", "/sistema/agenda"].some((route) =>
    pathname.startsWith(route),
  );

  return (
    <div
      aria-busy="true"
      aria-label="Carregando"
      className={`animate-pulse ${fullBleed ? "px-4 pt-5 sm:px-6 sm:pt-7" : ""}`}
    >
      <Bar className="h-7 w-52" />
      <Bar className="mt-2 h-4 w-72" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel p-5">
            <Bar className="h-3 w-24" />
            <Bar className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="panel mt-4 p-5">
        <Bar className="h-4 w-40" />
        <div className="mt-5 space-y-4">
          {["w-full", "w-11/12", "w-full", "w-10/12", "w-full", "w-9/12"].map((w, i) => (
            <Bar key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

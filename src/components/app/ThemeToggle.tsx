"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "alveo-tema";

/**
 * O tema vive no atributo data-theme do <html>, escrito antes da primeira
 * pintura por um script no layout. Aqui ele é lido como fonte externa — isso
 * evita guardar o mesmo estado em dois lugares e dessincronizar.
 */
let listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function isDark() {
  return document.documentElement.dataset.theme === "dark";
}

function setTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Navegador com armazenamento bloqueado: o tema vale só nesta sessão.
  }
  for (const listener of listeners) listener();
}

export function ThemeToggle() {
  // No servidor não há DOM; o tema claro é a suposição, e o script do layout
  // corrige antes de qualquer pintura.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  return (
    <button
      type="button"
      onClick={() => setTheme(!dark)}
      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      <span className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
        >
          {dark ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
            </>
          ) : (
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
          )}
        </svg>
        Modo {dark ? "claro" : "escuro"}
      </span>

      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
          dark ? "bg-accent" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            dark ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

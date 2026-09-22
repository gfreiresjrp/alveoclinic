import { Header } from "./Header";
import { Footer } from "./sections/Footer";

/** Casca das páginas legais: cabeçalho, corpo de texto e rodapé. */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 pt-36">
        <div className="container-x max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-lime">
            Atualizado em {updatedAt}
          </p>
          <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted sm:text-base [&_h2]:font-display [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

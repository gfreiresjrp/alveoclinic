import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const { de } = await searchParams;

  return (
    <main className="app-shell flex min-h-dvh">
      {/* formulário */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[46%] lg:px-16">
        <div className="mx-auto w-full max-w-[380px]">
          <Link href="/" className="text-xl" aria-label={site.brand}>
            <Logo tone="light" />
          </Link>

          <h1 className="font-display mt-10 text-2xl font-semibold tracking-tight text-zinc-900">
            Entrar no sistema
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Acesse a agenda, os prontuários e o financeiro da clínica.
          </p>

          <LoginForm redirectTo={de} />

          <p className="mt-8 text-xs text-zinc-400">
            Ambiente de demonstração · admin@sorrisovivo.com.br / alveo123
          </p>
        </div>
      </div>

      {/* ilustração — escondida no celular, onde só atrapalharia */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-8 border-l border-zinc-200 bg-white px-12 lg:flex">
        <Image
          src="/illustrations/login.svg"
          alt=""
          width={520}
          height={420}
          priority
          unoptimized
          className="max-h-[46vh] w-auto"
        />
        <div className="max-w-md text-center">
          <p className="font-display text-lg font-semibold text-zinc-900">
            A {site.ai} atende enquanto você atende.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Ela responde no WhatsApp, tira as dúvidas do paciente e marca na sua agenda —
            e chama a equipe quando o caso precisa de gente.
          </p>
        </div>
      </div>
    </main>
  );
}

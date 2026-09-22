import Image from "next/image";

import { site } from "@/lib/site";

type SvgProps = React.SVGProps<SVGSVGElement>;

/**
 * Símbolo ALVEO: o "A" vazado com a cunha lima interna.
 * A geometria foi traçada do arquivo original da marca — as diagonais são
 * todas 2:1 (0,5 de x para cada 1 de y), por isso os números fechados. O
 * viewBox é o retângulo justo da marca, para ela preencher o espaço que
 * recebe; o quadrado navy fica só no app icon (`src/app/icon.svg`).
 * O "A" usa `currentColor` para servir tanto em fundo escuro quanto claro;
 * a cunha é sempre lima.
 */
export function LogoSymbol({ title = site.brandShort, ...props }: SvgProps & { title?: string }) {
  return (
    <svg viewBox="25.1 28.1 50.7 42.95" fill="none" role="img" aria-label={title} {...props}>
      <path
        d="M46.55 28.1 H54.25 L75.8 71.05 H67.2 L50.45 37.2 L33.65 71.05 H25.1 Z"
        fill="currentColor"
      />
      <path d="M54.6 53.7 L63.3 71.05 H54.4 L50.2 62.5 Z" fill="#b3d123" />
    </svg>
  );
}

/**
 * Lockup da marca (ALVEO | CLINIC), a partir do arquivo original.
 * `tone="dark"` é a versão branca, para a landing page e a barra do sistema;
 * `tone="light"` é a versão navy, para fundo claro — o branco sumiria.
 * A altura acompanha o `font-size` de quem envolve (por isso `em`).
 */
export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Image
      src={tone === "dark" ? "/brand/alveo-wordmark.png" : "/brand/alveo-wordmark-navy.png"}
      alt={site.brand}
      width={525}
      height={63}
      priority
      className={`h-[1.05em] w-auto ${className}`}
    />
  );
}

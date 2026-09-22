"use client";

/**
 * Desenho de cada dente e da roda de faces do odontograma.
 *
 * A silhueta é montada por tipo e por arcada: a coroa muda de formato
 * (incisivo chanfrado, canino pontiagudo, pré-molar com duas cúspides, molar
 * com quatro) e o número de raízes segue a anatomia — molar superior tem três,
 * inferior tem duas, primeiro pré-molar superior tem duas, o resto tem uma.
 */

export type ToothType = "incisor" | "canine" | "premolar" | "molar";

/** Notação FDI: o segundo dígito diz a posição dentro do quadrante. */
export function toothType(tooth: number): ToothType {
  const position = tooth % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
}

const CERVICAL = 30;

/**
 * As coroas usam quase toda a largura do quadro: molar mais largo que
 * pré-molar, que é mais largo que canino e incisivo. É essa diferença de
 * largura que faz a arcada ser reconhecível de relance.
 */
const CROWNS: Record<ToothType, string> = {
  incisor: "M10 30 L30 30 L31 51 Q31 57 20 57 Q9 57 9 51 Z",
  canine: "M9.5 30 L30.5 30 L29.5 47.5 L20 57 L10.5 47.5 Z",
  premolar:
    "M7 30 L33 30 L33 47.5 Q33 54 28.5 56 Q24.5 57.8 20 53.5 Q15.5 57.8 11.5 56 Q7 54 7 47.5 Z",
  molar:
    "M4 30 L36 30 L36 46.5 Q36 53 31.5 55.2 Q28 56.8 25.2 53.6 Q22.6 56.8 20 53.8 Q17.4 56.8 14.8 53.6 Q12 56.8 8.5 55.2 Q4 53 4 46.5 Z",
};

/** Raiz afilada saindo da linha cervical até a ponta. */
function root(centerX: number, tip: number, halfWidth: number) {
  const left = centerX - halfWidth;
  const right = centerX + halfWidth;
  return [
    `M${left} ${CERVICAL}`,
    `C${left + 0.8} ${CERVICAL - 7} ${left + 2.2} ${tip + 5} ${centerX} ${tip}`,
    `C${right - 2.2} ${tip + 5} ${right - 0.8} ${CERVICAL - 7} ${right} ${CERVICAL}`,
    "Z",
  ].join(" ");
}

function rootsFor(tooth: number, type: ToothType, upper: boolean) {
  const position = tooth % 10;

  if (type === "incisor") return [root(20, 6, 8)];
  if (type === "canine") return [root(20, 3.5, 8.5)];

  if (type === "premolar") {
    // Só o primeiro pré-molar superior costuma ter duas raízes.
    if (upper && position === 4) return [root(14, 8, 4.6), root(26, 8, 4.6)];
    return [root(20, 6.5, 9)];
  }

  // Molares: três raízes em cima, duas embaixo.
  return upper
    ? [root(9.6, 9, 4.6), root(20, 6, 4.6), root(30.4, 9, 4.6)]
    : [root(13, 8, 6.2), root(27, 8, 6.2)];
}

const STROKE = "var(--tooth-stroke)";
const FILL = "var(--tooth-fill)";

export function ToothGlyph({
  tooth,
  upper,
  fill,
  crossed,
  faded,
  onClick,
  interactive,
}: {
  tooth: number;
  upper: boolean;
  fill: string | null;
  crossed: boolean;
  faded: boolean;
  onClick?: () => void;
  interactive: boolean;
}) {
  const type = toothType(tooth);
  const paths = [CROWNS[type], ...rootsFor(tooth, type, upper)];

  return (
    <svg
      viewBox="0 0 40 60"
      className={`w-full ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : "img"}
      aria-label={`Dente ${tooth}`}
    >
      {/* A arcada inferior é a mesma forma, espelhada na horizontal. */}
      <g
        transform={upper ? undefined : "translate(0,60) scale(1,-1)"}
        opacity={faded ? 0.3 : 1}
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={fill ?? FILL}
            stroke={STROKE}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </g>

      {crossed && (
        <path
          d="M10 20 L30 44 M30 20 L10 44"
          stroke="#e11d48"
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

const CENTER = 18;
const INNER = 6.5;
const OUTER = 14;

/** Cunha de uma face, entre dois ângulos, no anel externo da roda. */
function wedge(from: number, to: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const point = (deg: number, r: number) =>
    `${(CENTER + r * Math.cos(rad(deg))).toFixed(2)} ${(CENTER + r * Math.sin(rad(deg))).toFixed(2)}`;

  return [
    `M${point(from, INNER)}`,
    `L${point(from, OUTER)}`,
    `A${OUTER} ${OUTER} 0 0 1 ${point(to, OUTER)}`,
    `L${point(to, INNER)}`,
    `A${INNER} ${INNER} 0 0 0 ${point(from, INNER)}`,
    "Z",
  ].join(" ");
}

/**
 * Faces na roda. Vestibular fica sempre virada para fora da boca: em cima na
 * arcada superior, embaixo na inferior.
 */
export function FaceWheel({
  upper,
  colorOf,
  onPick,
  faded,
  interactive,
}: {
  upper: boolean;
  colorOf: (face: string) => string | null;
  onPick?: (face: string) => void;
  faded: boolean;
  interactive: boolean;
}) {
  const outerFace = upper ? "V" : "L";
  const innerFace = upper ? "L" : "V";

  const segments = [
    { face: outerFace, d: wedge(-135, -45) },
    { face: "D", d: wedge(-45, 45) },
    { face: innerFace, d: wedge(45, 135) },
    { face: "M", d: wedge(135, 225) },
  ];

  return (
    <svg
      viewBox="0 0 36 36"
      className="w-full"
      opacity={faded ? 0.3 : 1}
      role="group"
      aria-label="Faces do dente"
    >
      {segments.map((s) => (
        <path
          key={s.face}
          d={s.d}
          fill={colorOf(s.face) ?? FILL}
          stroke={STROKE}
          strokeWidth={1}
          className={interactive ? "cursor-pointer hover:fill-zinc-100" : ""}
          onClick={interactive ? () => onPick?.(s.face) : undefined}
        />
      ))}

      <circle
        cx={CENTER}
        cy={CENTER}
        r={INNER}
        fill={colorOf("O") ?? FILL}
        stroke={STROKE}
        strokeWidth={1}
        className={interactive ? "cursor-pointer hover:fill-zinc-100" : ""}
        onClick={interactive ? () => onPick?.("O") : undefined}
      />
      <circle cx={CENTER} cy={CENTER} r={OUTER} fill="none" stroke={STROKE} strokeWidth={1} />
    </svg>
  );
}

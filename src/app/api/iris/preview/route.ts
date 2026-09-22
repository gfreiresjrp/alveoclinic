import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { IRIS_DEFAULTS, previewIris, type IrisConfig, type IrisTone } from "@/lib/iris";

/**
 * Console de teste da aba da Íris. Recebe a configuração que está na tela
 * (mesmo a que ainda não foi salva) e devolve a resposta dela, sem gravar nada.
 */

const TONES: IrisTone[] = ["acolhedor", "direto", "formal"];

function sanitize(raw: unknown): IrisConfig {
  const o = (raw ?? {}) as Record<string, unknown>;
  const tone = String(o.tone ?? "");
  const max = Number(o.maxAiMessages);

  const texto = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s.slice(0, 4000);
  };

  return {
    ...IRIS_DEFAULTS,
    tone: TONES.includes(tone as IrisTone) ? (tone as IrisTone) : IRIS_DEFAULTS.tone,
    greeting: texto(o.greeting),
    canSchedule: o.canSchedule !== false,
    extraInstructions: texto(o.extraInstructions),
    maxAiMessages: Number.isFinite(max) ? Math.min(Math.max(Math.trunc(max), 0), 50) : 0,
  };
}

export async function POST(request: Request) {
  const { clinic } = await requireSession();

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.history)) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const history = (body.history as unknown[])
    .filter(
      (m): m is { role: string; text: string } =>
        typeof m === "object" && m !== null && "role" in m && "text" in m,
    )
    .slice(-20)
    .map((m) => ({
      role: m.role === "patient" ? ("patient" as const) : ("ai" as const),
      text: String(m.text).slice(0, 2000),
    }));

  if (history.length === 0) {
    return NextResponse.json({ error: "Nada para responder." }, { status: 400 });
  }

  try {
    const { reply, tools } = await previewIris(clinic.id, history, sanitize(body.config));
    if (!reply) {
      return NextResponse.json(
        { error: "A Íris não respondeu. Confira a chave da API." },
        { status: 502 },
      );
    }
    return NextResponse.json({ reply, tools });
  } catch {
    return NextResponse.json({ error: "Falha ao falar com a IA." }, { status: 502 });
  }
}

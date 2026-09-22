import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getSession } from "@/lib/session";
import { CONTENT_TYPES, MEDIA_DIR } from "@/lib/media";

export const runtime = "nodejs";

/** Serve o áudio de uma mensagem, só para quem está logado na clínica dona dela. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse("não autorizado", { status: 401 });

  const { id } = await params;

  const [row] = await db
    .select({ mediaPath: messages.mediaPath })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(eq(messages.id, id), eq(conversations.clinicId, session.clinic.id)))
    .limit(1);

  if (!row?.mediaPath) return new NextResponse("não encontrado", { status: 404 });

  // O nome vem do banco, mas basename fecha a porta para "../".
  const name = path.basename(row.mediaPath);
  const extension = name.split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return new NextResponse("formato inválido", { status: 415 });

  try {
    const file = await readFile(path.join(MEDIA_DIR, name));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("não encontrado", { status: 404 });
  }
}

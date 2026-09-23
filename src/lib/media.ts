import "server-only";
import path from "node:path";

/**
 * Onde ficam os áudios das conversas.
 *
 * Dois backends, escolhidos pelo ambiente:
 * - **Supabase Storage**, quando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
 *   existem. É o que vale em produção: serverless não tem disco que persista.
 * - **disco**, em `data/media`, quando não existem. É o modo de desenvolvimento.
 *
 * O resto do sistema só conhece o nome do arquivo, então a troca fica aqui.
 * A chave de serviço nunca sai do servidor — o bucket é privado e quem entrega
 * o áudio ao navegador é a rota `/api/media/[id]`, que confere a sessão antes.
 */

export const MEDIA_DIR = path.join(process.cwd(), "data", "media");

const BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "media";

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export const CONTENT_TYPES: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export function extensionFor(mimeType: string) {
  // O navegador manda "audio/webm;codecs=opus"; só o tipo base interessa.
  return EXTENSIONS[mimeType.split(";")[0].trim()] ?? null;
}

function storage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function isRemoteStorage() {
  return storage() !== null;
}

export async function saveAudio(id: string, file: File) {
  const extension = extensionFor(file.type);
  if (!extension) return null;
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) return null;

  const name = `${id}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = CONTENT_TYPES[extension];

  const remote = storage();
  if (remote) {
    const response = await fetch(
      `${remote.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${remote.key}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: bytes,
      },
    );
    if (!response.ok) {
      console.error(`[media] upload falhou (${response.status}): ${await response.text()}`);
      return null;
    }
    return name;
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, name), bytes);
  return name;
}

/** Devolve os bytes do áudio, venham do bucket ou do disco. */
export async function readAudio(fileName: string): Promise<Uint8Array<ArrayBuffer> | null> {
  // O nome vem do banco, mas basename fecha a porta para "../".
  const name = path.basename(fileName);

  const remote = storage();
  if (remote) {
    const response = await fetch(
      `${remote.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${remote.key}` } },
    );
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  }

  try {
    const { readFile } = await import("node:fs/promises");
    // Uint8Array.from copia para um ArrayBuffer próprio; o Buffer do Node
    // aponta para um pool compartilhado, que não satisfaz BodyInit.
    return Uint8Array.from(await readFile(path.join(MEDIA_DIR, name)));
  } catch {
    return null;
  }
}

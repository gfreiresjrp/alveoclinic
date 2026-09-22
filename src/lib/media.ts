import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Áudios das conversas ficam em data/media, fora do bundle e fora do git.
 * Em um deploy serverless isso precisa virar um bucket — o resto do código
 * só conhece o nome do arquivo, então a troca fica isolada aqui.
 */
export const MEDIA_DIR = path.join(process.cwd(), "data", "media");

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

export async function saveAudio(id: string, file: File) {
  const extension = extensionFor(file.type);
  if (!extension) return null;
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) return null;

  await mkdir(MEDIA_DIR, { recursive: true });
  const name = `${id}.${extension}`;
  await writeFile(path.join(MEDIA_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

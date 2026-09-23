/**
 * Sessão do sistema: cookie assinado com HMAC-SHA256 e senha em PBKDF2.
 * Tudo com Web Crypto, então roda igual no proxy (edge) e no servidor.
 */
export const SESSION_COOKIE = "alveo_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 210_000;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "AUTH_SECRET não definido. É o segredo que assina o cookie de sessão: gere com `openssl rand -base64 32` e configure no ambiente (.env.local aqui, variáveis do projeto no deploy).",
    );
  }
  return s;
}

function toHex(buf: ArrayBuffer | Uint8Array) {
  const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Comparação em tempo constante, para não vazar o segredo por timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

async function pbkdf2(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return toHex(bits);
}

/** Formato armazenado: pbkdf2$<iterações>$<salt hex>$<hash hex> */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, , saltHex, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !saltHex || !hash) return false;
  return safeEqual(await pbkdf2(password, fromHex(saltHex)), hash);
}

export async function createSessionToken(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Devolve o userId quando o token é válido e não expirou. */
export async function readSessionToken(token: string | undefined | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || Number(exp) < Date.now()) return null;
  return safeEqual(await hmac(`${userId}.${exp}`), sig) ? userId : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

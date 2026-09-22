const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Id curto, ordenável por tempo e sem colisão prática para a escala de uma clínica. */
export function newId(prefix = "") {
  const time = Date.now().toString(36).padStart(9, "0");
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let rand = "";
  for (const b of bytes) rand += ALPHABET[b % ALPHABET.length];
  return `${prefix}${time}${rand}`;
}

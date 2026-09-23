import "server-only";

/**
 * Conector do WhatsApp Cloud API.
 *
 * Sem as variáveis configuradas, o envio vira no-op registrado no log — o
 * sistema inteiro continua funcionando e as mensagens ficam salvas no banco.
 * Variáveis necessárias:
 *   WHATSAPP_TOKEN          token permanente do app da Meta
 *   WHATSAPP_PHONE_ID       id do número remetente
 *   WHATSAPP_VERIFY_TOKEN   segredo usado na verificação do webhook
 */
export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function sendWhatsAppMessage(to: string, text: string) {
  if (!isWhatsAppConfigured()) {
    console.info(`[whatsapp] não configurado — mensagem para ${to} só foi salva.`);
    return { sent: false as const };
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!response.ok) {
    console.error("[whatsapp] falha ao enviar:", await response.text());
    return { sent: false as const };
  }

  return { sent: true as const };
}

/**
 * Envia um áudio. A Cloud API exige duas etapas: subir o arquivo para /media
 * e depois mandar a mensagem referenciando o id devolvido.
 *
 * Sem credenciais isso não roda — e, mesmo com elas, este caminho ainda não
 * foi exercitado contra a API real.
 */
export async function sendWhatsAppAudio(to: string, mediaFileName: string) {
  if (!isWhatsAppConfigured()) {
    console.info(`[whatsapp] não configurado — áudio para ${to} só foi salvo.`);
    return { sent: false as const };
  }

  const path = await import("node:path");
  const { CONTENT_TYPES, readAudio } = await import("./media");

  const name = path.basename(mediaFileName);
  const extension = name.split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return { sent: false as const };

  const bytes = await readAudio(name);
  if (!bytes) return { sent: false as const };

  const upload = new FormData();
  upload.append("messaging_product", "whatsapp");
  upload.append("type", contentType);
  upload.append("file", new Blob([bytes], { type: contentType }), name);

  const uploaded = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: upload,
    },
  );

  if (!uploaded.ok) {
    console.error("[whatsapp] falha ao subir áudio:", await uploaded.text());
    return { sent: false as const };
  }

  const { id } = (await uploaded.json()) as { id: string };

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "audio",
        audio: { id },
      }),
    },
  );

  if (!response.ok) {
    console.error("[whatsapp] falha ao enviar áudio:", await response.text());
    return { sent: false as const };
  }

  return { sent: true as const };
}

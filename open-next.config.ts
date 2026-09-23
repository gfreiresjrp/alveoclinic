import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Adaptador que empacota o Next para o Cloudflare Workers.
 * Sem cache incremental configurado: as páginas do sistema são todas
 * dinâmicas (dependem do cookie de sessão), então não há o que guardar.
 */
export default defineCloudflareConfig();

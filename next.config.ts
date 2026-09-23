import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esconde o indicador flutuante do Next no canto da tela em desenvolvimento.
  devIndicators: false,

  experimental: {
    /*
     * Guarda o resultado das telas já visitadas no cache do roteador, do lado
     * do cliente. Voltar a uma aba aberta há pouco passa a ser troca local,
     * sem nenhuma ida ao servidor. Trinta segundos é curto o bastante para a
     * clínica não trabalhar em cima de dado velho, e toda mutação chama
     * `revalidatePath`, que limpa o cache na hora.
     */
    staleTimes: { dynamic: 30 },

    /*
     * Sem isto, passar o mouse num item do trilho busca só o esqueleto: a
     * parte dinâmica — que é justamente a que custa — só começaria no clique.
     * Com isto, os dados chegam durante o hover e o clique vira troca de tela.
     */
    dynamicOnHover: true,
  },
};

export default nextConfig;

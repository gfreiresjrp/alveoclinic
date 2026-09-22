import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como a ${site.brand} coleta, usa e protege os dados de clínicas e pacientes.`,
};

export default function Privacidade() {
  return (
    <LegalPage title="Política de privacidade" updatedAt="setembro de 2026">
      <p>
        Esta política explica como a {site.brand} trata os dados pessoais de quem
        entra em contato pelo site e de quem usa a plataforma, em conformidade com a
        Lei nº 13.709/2018 (LGPD).
      </p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li>
          <strong>No site:</strong> nome e telefone informados no formulário de
          diagnóstico, além das respostas do questionário.
        </li>
        <li>
          <strong>Na plataforma:</strong> dados cadastrais da clínica, dos
          profissionais e dos pacientes, incluindo informações de saúde inseridas
          pelos próprios profissionais.
        </li>
        <li>
          <strong>Nas conversas com a {site.ai}:</strong> o conteúdo das mensagens
          trocadas no WhatsApp e nos demais canais habilitados.
        </li>
      </ul>

      <h2>Para que usamos</h2>
      <p>
        Para responder ao seu contato, prestar o serviço contratado, agendar
        atendimentos, manter o histórico clínico disponível para a clínica e cumprir
        obrigações legais e regulatórias.
      </p>

      <h2>Papéis</h2>
      <p>
        Em relação aos dados dos pacientes, a clínica contratante é a controladora e
        a {site.brand} atua como operadora, tratando os dados apenas conforme as
        instruções da clínica e o contrato firmado.
      </p>

      <h2>Compartilhamento</h2>
      <p>
        Não vendemos dados pessoais. Compartilhamos apenas com fornecedores de
        infraestrutura, comunicação e inteligência artificial necessários à operação,
        sempre sob contrato e obrigação de confidencialidade.
      </p>

      <h2>Segurança</h2>
      <p>
        Os dados são criptografados em trânsito e em repouso, com backup automático,
        controle de acesso por perfil e registro auditável de cada operação.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir confirmação, acesso, correção, portabilidade, anonimização ou
        exclusão dos seus dados, além de revogar consentimento, escrevendo para{" "}
        <a href={`mailto:${site.email}`} className="text-lime">
          {site.email}
        </a>
        .
      </p>
    </LegalPage>
  );
}

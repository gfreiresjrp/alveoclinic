import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: `Condições de uso da plataforma ${site.brand} e da assistente virtual ${site.ai}.`,
};

export default function Termos() {
  return (
    <LegalPage title="Termos de uso" updatedAt="setembro de 2026">
      <p>
        Estes termos regulam o uso da plataforma {site.brand} e da assistente
        virtual {site.ai} pelas clínicas contratantes e por seus profissionais.
      </p>

      <h2>O serviço</h2>
      <p>
        A {site.brand} oferece um sistema de gestão clínica (agenda, prontuário,
        prescrição, financeiro e teleconsulta) e uma assistente virtual que faz o
        pré-atendimento dos pacientes nos canais habilitados pela clínica.
      </p>

      <h2>Limites da assistente virtual</h2>
      <ul>
        <li>
          A {site.ai} se identifica como assistente virtual em toda conversa e não
          se passa por profissional de saúde.
        </li>
        <li>
          Ela não emite diagnóstico, prescrição ou conduta terapêutica. A decisão
          clínica é sempre do profissional habilitado.
        </li>
        <li>
          A clínica define as regras de atendimento, os valores informados e as
          situações em que a conversa é transferida para uma pessoa.
        </li>
      </ul>

      <h2>Responsabilidades da clínica</h2>
      <p>
        Manter cadastros e valores atualizados, garantir que os profissionais tenham
        registro ativo, obter o consentimento dos pacientes quando exigido e zelar
        pelas credenciais de acesso da equipe.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Trabalhamos para manter o serviço disponível de forma contínua, com janelas
        de manutenção comunicadas com antecedência. Interrupções causadas por
        terceiros, como a indisponibilidade do WhatsApp, fogem ao nosso controle.
      </p>

      <h2>Vigência e rescisão</h2>
      <p>
        O contrato pode ser encerrado por qualquer das partes conforme as condições
        comerciais acordadas. Encerrado o contrato, a clínica pode exportar seus
        dados antes da exclusão definitiva.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos:{" "}
        <a href={`mailto:${site.email}`} className="text-lime">
          {site.email}
        </a>
        .
      </p>
    </LegalPage>
  );
}

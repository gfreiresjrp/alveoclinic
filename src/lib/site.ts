/**
 * Configuração central da marca e do conteúdo da landing page.
 * Trocar nome do produto, da IA, telefones e links aqui reflete no site inteiro.
 */
export const site = {
  brand: "Alveo Clinic",
  brandShort: "Alveo",
  ai: "Íris",
  niche: "clínica odontológica",
  tagline: "A IA de pré-atendimento do seu consultório",
  url: "https://clinic.alveo.com.br",
  appUrl: "/sistema",
  whatsapp: {
    number: "5500000000000",
    message:
      "Olá! Quero conhecer a Íris, a IA de pré-atendimento da Alveo Clinic.",
  },
  email: "contato@alveo.com.br",
} as const;

export const whatsappHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(
  site.whatsapp.message,
)}`;

export const nav = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: `A ${site.ai}`, href: "#a-ia" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Dúvidas", href: "#faq" },
] as const;

export const stats = [
  {
    value: "21x",
    label: "mais chance de qualificar um lead quando a resposta sai em até 5 minutos",
  },
  {
    value: "33%",
    label: "dos agendamentos digitais são feitos fora do horário comercial",
  },
  {
    value: "66,7%",
    label: "de conversão quando o horário é fechado dentro da mesma conversa",
  },
  {
    value: "82%",
    label: "das clínicas brasileiras ainda não usam inteligência artificial",
  },
] as const;

export const statsSource =
  "Fontes: Lead Response Management Study, Perfil do Paciente Digital, benchmark Chili Piper e TIC Saúde / Cetic.br.";

export const steps = [
  {
    title: "O paciente manda mensagem no WhatsApp",
    text: "Meia-noite, domingo, feriado. O canal está sempre aberto e a resposta nunca depende de alguém estar na recepção.",
  },
  {
    title: `A ${site.ai} responde em segundos`,
    text: "Clareamento, implante, aparelho, canal, convênio, valor da avaliação. Conversa de verdade, sem menu numerado.",
  },
  {
    title: "Ela abre a agenda real e marca",
    text: "Consulta a cadeira e o dentista certo, respeita a duração de cada procedimento e grava o agendamento no sistema.",
  },
  {
    title: "Quando precisa de gente, ela transfere",
    text: "Dor aguda, urgência ou negociação de orçamento vão para a sua equipe com o histórico completo da conversa.",
  },
] as const;

export const aiSkills = [
  { title: "Responde em segundos", text: "24 horas por dia, todos os dias do ano" },
  { title: "Entende o pedido", text: "Linguagem natural, não árvore de opções" },
  { title: "Tira as dúvidas de sempre", text: "Procedimento, valor e convênio" },
  { title: "Agenda na conversa", text: "Na cadeira e no dentista certos" },
  { title: "Qualifica antes de passar", text: "Sua equipe recebe o caso pronto" },
  { title: "Escala para um humano", text: "Urgência, dor e negociação" },
] as const;

export const platform = [
  { title: "Agenda por cadeira", text: `A fonte da verdade da ${site.ai}` },
  { title: "Odontograma", text: "Dente a dente, face a face" },
  { title: "Plano de tratamento", text: "Do diagnóstico ao orçamento" },
  { title: "Prontuário odontológico", text: "Evolução e anexos na nuvem" },
  { title: "Prescrição digital", text: "Assinatura com validade legal" },
  { title: "Financeiro e parcelas", text: "Recebimentos e inadimplência" },
  { title: "Convênios e TISS", text: "Guias sem digitar duas vezes" },
  { title: "Documentos digitais", text: "Termos e atestados sem papel" },
  { title: "Copiloto clínico", text: "Escreve a evolução junto com você" },
] as const;

export const compliance = [
  {
    title: "Alinhada à Resolução CFM 2.454/2026",
    text: `A ${site.ai} se identifica como assistente virtual e não emite diagnóstico nem conduta. A decisão clínica é sempre do cirurgião-dentista.`,
  },
  {
    title: "Dentro do Código de Ética Odontológica",
    text: "Nada de promessa de resultado, preço como chamariz ou conteúdo sensacionalista nas respostas automáticas.",
  },
  {
    title: "Proteção de ponta a ponta",
    text: "Dados criptografados em trânsito e em repouso, com backup automático do primeiro “oi” ao prontuário.",
  },
  {
    title: "Pronta para auditoria",
    text: "Cada conversa e cada agendamento ficam rastreáveis, e você controla quem acessa o quê.",
  },
] as const;

export const differentials = [
  "Configuração feita junto com a sua equipe",
  `${site.ai} treinada com a sua tabela de procedimentos`,
  "Suporte humano especializado",
  "Migração de dados sem dor de cabeça",
] as const;

export const faq = [
  {
    q: `O que é a ${site.ai}?`,
    a: `É a inteligência artificial de pré-atendimento da ${site.brand}. Ela recebe o paciente no WhatsApp, entende o que ele precisa, responde as dúvidas comuns do consultório e marca a consulta na agenda — tudo dentro da mesma conversa.`,
  },
  {
    q: "Qual a diferença para um chatbot comum?",
    a: "Chatbot segue fluxo fixo e trava quando o paciente foge do roteiro. A Íris conversa em linguagem natural, consulta a agenda real do dentista e grava o agendamento no sistema. Ela não devolve um protocolo: devolve um horário marcado.",
  },
  {
    q: "Ela agenda sozinha de verdade?",
    a: "Sim. Como ela vive dentro do mesmo sistema da sua agenda, enxerga bloqueios, cadeiras disponíveis, duração de cada procedimento e a especialidade de cada dentista. Você define as regras e ela respeita todas.",
  },
  {
    q: "E quando o paciente chega com dor?",
    a: "Urgência é um dos gatilhos de transferência. A Íris acolhe, coleta o essencial e passa imediatamente para a sua equipe, sinalizando o caso como prioritário.",
  },
  {
    q: "Ela fala de preço de tratamento?",
    a: "Ela informa o valor da avaliação e os valores que você autorizar na tabela. Orçamento de tratamento depende de exame clínico, então a Íris conduz o paciente para a avaliação em vez de prometer número fechado — como manda o Código de Ética Odontológica.",
  },
  {
    q: "Isso está dentro das regras do CFO e da LGPD?",
    a: "Sim. A Íris se apresenta como assistente virtual, não dá diagnóstico nem conduta, coleta dados com consentimento e mantém registro auditável. A responsabilidade clínica continua inteiramente do cirurgião-dentista responsável.",
  },
  {
    q: "Quanto tempo leva para colocar no ar?",
    a: "Em média uma semana. Nesse período a gente mapeia procedimentos, valores, convênios e regras de agenda, treina a Íris com esse material e testa junto com a sua equipe antes de liberar para os pacientes.",
  },
] as const;

export const quiz = [
  {
    question: "Quantas mensagens de pacientes o consultório recebe por dia?",
    options: ["Até 20 por dia", "De 20 a 50", "De 50 a 150", "Mais de 150"],
  },
  {
    question: "Hoje, quem responde essas mensagens?",
    options: [
      "A recepção, entre um paciente e outro",
      "Uma pessoa dedicada ao WhatsApp",
      "Um chatbot / robô de menu",
      "Ninguém fixo — sobra para quem estiver livre",
    ],
  },
  {
    question: "O que mais te incomoda no atendimento atual?",
    options: [
      "Demora para responder",
      "Mensagem sem resposta fora do horário",
      "Paciente que some antes de marcar",
      "Cadeira vazia por falta e desmarcação",
    ],
  },
  {
    question: "Quantos dentistas atendem na clínica?",
    options: ["Só eu", "De 2 a 5", "De 6 a 15", "Mais de 15"],
  },
] as const;

# Alveo Clinic

Landing page + sistema de gestão para clínicas odontológicas, com a **Íris**: a IA
de pré-atendimento que conversa no WhatsApp e marca na agenda real da clínica.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — tokens da marca Alveo em `src/app/globals.css`
- Drizzle ORM + libSQL (SQLite local em dev, Turso em produção)
- Anthropic SDK (motor da Íris) + WhatsApp Cloud API
- Fontes: Poppins (display) + Montserrat (texto)

## Banco

Postgres no Supabase, via Drizzle + `postgres-js`. Variáveis necessárias:

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | Connection string. Em produção use o **transaction pooler** (porta 6543); para `db:push` use a **direta** (5432), que o pooler não faz DDL |
| `SUPABASE_URL` | Projeto do Supabase, para o Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço, só no servidor |
| `SUPABASE_MEDIA_BUCKET` | Opcional; o padrão é `media` |

A conexão em `src/db/index.ts` é **preguiçosa de propósito**: o `next build`
importa cada rota para coletar configuração, e abrir o banco no topo do módulo
derrubava o build numa máquina sem banco.

Os áudios das conversas seguem a mesma lógica em `src/lib/media.ts`: com
`SUPABASE_URL` e a chave de serviço presentes vão para o Storage; sem elas,
para `data/media` — que é o modo de desenvolvimento. Serverless não tem disco
que persista, então em produção o bucket não é opcional. O bucket é privado: o
áudio chega ao navegador pela rota `/api/media/[id]`, que confere a sessão.

## Rodando

```bash
npm install
cp .env.example .env.local   # ajuste AUTH_SECRET
npm run db:push              # cria as tabelas
npm run db:seed              # clínica de demonstração
npm run dev
```

Acesso de demonstração: `admin@sorrisovivo.com.br` / `alveo123`
(a senha vale para os quatro usuários do seed).

## Rotas

| Rota | O que é |
| --- | --- |
| `/` | Landing page de vendas |
| `/privacidade`, `/termos` | Páginas legais |
| `/sistema/entrar` | Login |
| `/sistema` | Visão geral do dia |
| `/sistema/agenda` | Grade semanal, novo agendamento, status |
| `/sistema/pacientes` | Lista, cadastro e ficha completa |
| `/sistema/pacientes/[id]` | Odontograma, planos, evolução, histórico |
| `/sistema/financeiro` | Receitas, despesas, baixa de pagamento |
| `/sistema/conversas` | Conversas da Íris, assumir e responder |
| `/sistema/campanhas` | Campanhas automáticas por público |
| `/sistema/iris` | Configuração, indicadores e console de teste da IA |
| `/sistema/notificacoes` | Central de avisos da clínica |
| `/sistema/relatorios` | Indicadores da clínica por período |
| `/sistema/estoque` | Materiais, saldo e movimentações |
| `/sistema/proteticos` | Trabalhos enviados ao laboratório |
| `/sistema/configuracoes` | Clínica, equipe, consultórios, procedimentos |
| `/api/whatsapp` | Webhook do WhatsApp Cloud API |
| `/api/campanhas/run` | Disparo diário das campanhas (chamado por cron externo) |
| `/api/iris/preview` | Console de teste da Íris (não grava nada) |

## Como a Íris funciona

`src/lib/iris.ts` roda um loop de ferramentas contra o modelo:

1. `consultar_horarios` — busca em `src/lib/availability.ts` os horários realmente
   livres, considerando expediente, duração do procedimento e agenda de cada dentista;
2. `agendar` — revalida o conflito, reaproveita o cadastro pelo telefone e grava o
   agendamento com `source: "ai"`;
3. `transferir_para_humano` — muda a conversa para `human` e a IA para de responder.

A IA nunca inventa horário: ela só enxerga a agenda por essas ferramentas, que batem
no mesmo banco que a recepção usa. O prompt proíbe diagnóstico, conduta e fechamento
de orçamento pelo WhatsApp, alinhado ao Código de Ética Odontológica.

**Sem `ANTHROPIC_API_KEY` a Íris não responde** e **sem as variáveis do WhatsApp as
mensagens não saem** — nos dois casos o restante do sistema funciona normalmente e o
painel avisa que a conexão está pendente.

## Gerenciando a Íris

`/sistema/iris`. A configuração fica em `iris_settings` (uma linha por clínica)
e **muda o motor de verdade** — não é enfeite de tela:

| Ajuste | O que acontece em `src/lib/iris.ts` |
| --- | --- |
| Ligada/desligada | Desligada, cada conversa nova já vai para a equipe, sem gastar chamada de IA |
| Tom | Troca a linha de estilo no prompt (acolhedor, direto ou formal) |
| Apresentação | Entra como a frase de identificação da primeira mensagem |
| Marcar consulta sozinha | Desligado, a ferramenta `agendar` nem é enviada ao modelo |
| Responder fora do horário | Fora da janela da clínica, responde a mensagem de ausência sem chamar a IA |
| Palavras que transferem | Casando com a mensagem do paciente, transfere **antes** de chamar o modelo |
| Limite de respostas | Passando de N respostas na conversa, passa para a equipe |
| Instruções da clínica | Texto livre acrescentado ao fim do prompt |

A tela ainda mostra os indicadores dos últimos 30 dias (conversas, quanto ela
resolveu sozinha, quantas passou adiante e quantos agendamentos criou) e a
lista dos motivos de transferência — é por ali que se enxerga onde ela trava.

### Console de teste

O box "Testar a Íris" conversa com ela usando a configuração **que está na
tela**, inclusive a ainda não salva, para dar para conferir uma mudança antes
de soltar no WhatsApp. Roda o mesmo prompt e as mesmas ferramentas, mas em
modo `preview`: nada é gravado em `messages` e `agendar`/`transferir_para_humano`
só relatam o que fariam. Precisa de `ANTHROPIC_API_KEY` e consome a mesma
chave do atendimento.

## Notificações

`/sistema/notificacoes` e o sino da barra lateral. **Não existe tabela de
notificações**: `src/lib/notifications.ts` deriva tudo do estado atual —
conversas esperando a equipe, itens no mínimo ou zerados, trabalhos protéticos
fora do prazo, lembretes de paciente vencidos, recebimentos atrasados e
consultas de amanhã ainda não confirmadas.

A escolha é de propósito: sem "marcar como lido", o aviso desaparece quando o
motivo dele é resolvido, e o badge do sino nunca mente.

## Campanhas automáticas

Seis tipos prontos em `src/lib/campaigns.ts`: aniversariantes, retorno semestral,
reativação, inadimplentes, pesquisa de satisfação e uma personalizada. O público de
cada uma é **calculado na hora** a partir da agenda, do cadastro e do financeiro —
não existe lista de contatos paralela.

O texto é um modelo com variáveis entre chaves (`{paciente}`, `{clinica}`, `{valor}`,
`{ultima_visita}`, `{meses}`), editável pela interface.

**O sistema não tem agendador próprio.** `POST /api/campanhas/run` dispara todas as
campanhas ativas e precisa ser chamado uma vez por dia por um cron externo, com
`Authorization: Bearer $CRON_SECRET`. Sem essa variável configurada, o endpoint
recusa qualquer chamada. Pelo painel, o botão "Enviar agora" roda a campanha na hora.

Cada disparo fica em `campaign_sends`, o que impede a mesma pessoa de receber a
mesma campanha duas vezes no mesmo dia.

### Ilustrações

O sistema usa ilustrações do **unDraw** (undraw.co), em `public/illustrations/`:
cards de campanha, tela de login, faixa do WhatsApp, cartão da Íris e os estados
vazios (agenda livre, sem conversas, busca sem resultado, sem lançamentos).
A licença é livre para uso comercial **sem atribuição obrigatória** e sem marca
d'água. O roxo padrão (`#6c63ff`) foi trocado pelo azul do sistema (`#2563eb`).

Para trocar uma delas: baixe o SVG de `cdn.undraw.co`, salve com o mesmo nome do
arquivo e refaça a troca de cor. **Confira que o arquivo começa com `<svg` ou
`<?xml`** — o CDN devolve uma página de erro com status 200 quando o caminho está
errado, e ela seria salva como se fosse imagem.

Estados vazios recebem a arte pelo parâmetro `art` do componente `EmptyState`.

## Atendimento e recepção

A agenda tem sete status: agendado, confirmado, **na recepção** (check-in, que
grava a hora real da chegada e pinta o card de roxo), atendido, faltou,
**remarcou** e cancelado. Falta, remarcação e cancelamento **exigem
justificativa escrita** — sem ela a action recusa a gravação.

O agendamento também guarda o **motivo da consulta**, que aparece no tooltip do
card e no detalhe.

## Pagamentos parciais

Um lançamento pode ser recebido em pedaços e em formas diferentes: cada
recebimento vira uma linha em `payments`, e `finance_entries.paid_cents` acumula
o total. O lançamento só é marcado como pago quando o saldo zera; antes disso
fica com o status **Parcial**.

Registros criados antes dessa mudança têm `paid_at` sem `paid_cents`; a
interface trata quitado como valor cheio, então o histórico continua batendo.

## Documentos

Seis modelos em `src/lib/documents.ts`: recibo, atestado, encaminhamento,
receituário, pedido de exame e contrato. O sistema monta um **rascunho** com os
dados da clínica, do paciente e do profissional; o texto é editável antes de
salvar, e o que ficou salvo é exatamente o que vai para a impressão.

`/sistema/documentos/[id]` é a folha pronta — cabeçalho da clínica com CNPJ e
CRO, dados do paciente, corpo e linha de assinatura. O botão usa `window.print()`
do navegador, que também salva em PDF. As regras de `@media print` escondem o
trilho e a barra e ajustam a página para A4.

## Relatórios

`/sistema/relatorios` com período ajustável (mês, 30 dias, 90 dias, ano ou
intervalo): agendamentos e taxa de falta, atendimentos por dentista,
procedimentos mais frequentes, canais de captação, orçamentos em aberto e
agendamentos por situação.

## Estoque

`/sistema/estoque`. Cada material tem um **saldo materializado** (`stock_items.quantity`)
e um histórico que o explica (`stock_moves`). Toda movimentação é de um dos três
tipos:

- **Entrada** — compra ou reposição, soma no saldo.
- **Saída** — consumo no atendimento, subtrai.
- **Acerto** — correção de contagem, grava o saldo absoluto.

Saída maior que o saldo é recusada no servidor (`Só há N un em estoque.`), então
o saldo nunca fica negativo. Um item cujo saldo caiu até o mínimo aparece como
"precisa repor" e dispara o alerta no topo da tela.

## Protéticos

`/sistema/proteticos`. O caderninho do laboratório dentro do sistema: paciente,
dentista, laboratório, trabalho, dentes, prazo e custo. O fluxo é
`enviado → voltou → instalado`; marcar "voltou" carimba a data de retorno.
Um trabalho ainda no laboratório com prazo vencido conta como **atrasado** e
aparece no alerta do topo.

## Modo escuro

Ligado pelo ícone de perfil no rodapé da barra lateral. Não são variantes
`dark:` espalhadas pelas telas: há uma **camada de remapeamento** no fim de
`globals.css`, escopada em `[data-theme="dark"] .app-shell`, que reescreve a
paleta de neutros (zinc/slate/white) e os tons semânticos (rose, amber, emerald,
blue, sky, violet) que o sistema já usava de forma disciplinada. Os dentes do
odontograma e as barras dos relatórios seguem variáveis CSS (`--tooth-fill`,
`--tooth-stroke`, `--chart-empty`) em vez de cores fixas.

A escolha fica em `localStorage` (`alveo-tema`) e um script inline no topo do
`<body>` aplica `data-theme` antes da hidratação para não piscar branco. Por
isso o `<html>` leva `suppressHydrationWarning`: o atributo sempre difere do
HTML do servidor.

## Barra lateral

No desktop o trilho tem 68px e **expande para 232px no hover**, por cima do
conteúdo — o `main` continua com `pl-[68px]`, então nada se mexe embaixo. Cada
item é uma linha de largura total com uma coluna de ícone fixa em 40px, o que
mantém o ícone exatamente no mesmo x aberto ou fechado; só o rótulo entra,
recortado pelo `overflow: hidden` do `<aside>`.

No topo, colapsado aparece só o símbolo e expandido só o lockup inteiro — os
dois fazem cross-fade no mesmo lugar (o wordmark é absoluto), já que o lockup
já traz o "A" dentro dele.

Quem abre é só o bloco de navegação (`.rail-expander`, que cobre o trilho
inteiro acima do rodapé): passar o mouse no sino ou no avatar **não** expande.
Se já estiver aberto, descer até o rodapé não fecha — o colapso só acontece ao
sair do `<aside>`. Por isso o estado é React (`railHover`) e não `:hover` em
CSS, que não consegue distinguir os dois casos.

O popover da conta fica **fora** do `<aside>` (que tem `overflow: hidden`) e é
ancorado em `position: fixed` ao lado do trilho, para clicar no avatar não
precisar abrir a barra. Ele acompanha os dois estados: `left: 76px` com o
trilho fechado e `left: 240px` com ele aberto, para não cobrir os rótulos.
Os itens do trilho são `<button>` com `router.push`, não `<a href>`: o
navegador mostra a URL na barra de status a cada hover sobre um link, e não há
como desligar isso pela página. O `router.prefetch` no `onMouseEnter` mantém a
navegação tão rápida quanto a do `<Link>`. O custo é perder o abrir-em-nova-aba
do meio do mouse — aceitável no menu, por isso as tabelas e as listas
continuam com links de verdade.

Abaixo de `lg` nada disso vale: lá o menu é a barra superior.

## Marca

Os arquivos originais da marca ficam em `public/brand/`:

| Arquivo | Onde entra |
| --- | --- |
| `alveo-wordmark.png` | Lockup branco — landing page e fundos escuros (`<Logo />`) |
| `alveo-wordmark-navy.png` | Lockup navy — login e fundos claros (`<Logo tone="light" />`) |
| `alveo-icon.png` | Quadrado navy 512px, usado no Open Graph e no Twitter card |

O símbolo isolado (`<LogoSymbol />`, a barra lateral do sistema) é SVG traçado
do arquivo original: todas as diagonais são 2:1, e o `viewBox` é o retângulo
justo da marca para ela preencher o espaço que recebe. O "A" usa
`currentColor`; a cunha é sempre lima `#b3d123`. O quadrado navy completo só
aparece no app icon, em `src/app/icon.svg` e `src/app/apple-icon.png`.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Marca, nome da IA, WhatsApp, e-mail e todo o copy da LP | `src/lib/site.ts` |
| Cores, fontes e fundo da landing page | `src/app/globals.css` (bloco `@theme`) |
| Cor de acento do sistema | `src/app/globals.css` → `--color-accent*` |
| Logo e símbolo | `src/components/Logo.tsx` · `public/brand/` |
| Modelo de dados | `src/db/schema.ts` |
| Regras da Íris (prompt e ferramentas) | `src/lib/iris.ts` |
| O que vira notificação | `src/lib/notifications.ts` |
| Paleta do modo escuro | `src/app/globals.css` → bloco `[data-theme="dark"]` |
| Dados de demonstração | `scripts/seed.ts` |

## Pendências conhecidas

- O número do WhatsApp na LP (`site.whatsapp.number`) ainda é um placeholder.
- Não há upload de anexos no prontuário nem emissão de guias TISS.
- Prescrição digital com assinatura ICP-Brasil depende de contratar o certificado.
- Multi-clínica existe no schema, mas o webhook resolve uma clínica por instalação.

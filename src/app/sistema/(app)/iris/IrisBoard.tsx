"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { IrisConfig, IrisTone } from "@/lib/iris";
import { Card, CardTitle, PageHeader, StatCard, Tag } from "@/components/app/ui";
import { IconAlert, IconCheck, IconRobot, IconSend } from "@/components/Icons";
import { hhmm } from "@/lib/format";
import { saveIrisSettings, toggleIris } from "./actions";

type Stats = {
  conversas: number;
  resolvidas: number;
  transferidas: number;
  agendamentos: number;
  respostas: number;
};

const TONS: { key: IrisTone; label: string; hint: string }[] = [
  { key: "acolhedor", label: "Acolhedor", hint: "Recepcionista atenciosa, frases curtas" },
  { key: "direto", label: "Direto", hint: "Responde o que foi perguntado, sem rodeio" },
  { key: "formal", label: "Formal", hint: "Senhor/senhora, vocabulário profissional" },
];

export function IrisBoard({
  settings,
  apiConfigured,
  whatsappConfigured,
  clinicHours,
  stats,
  handoffs,
}: {
  settings: IrisConfig;
  apiConfigured: boolean;
  whatsappConfigured: boolean;
  clinicHours: { opening: number; closing: number };
  stats: Stats;
  handoffs: { id: string; contato: string; motivo: string }[];
}) {
  const [cfg, setCfg] = useState(settings);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof IrisConfig>(campo: K, valor: IrisConfig[K]) {
    setCfg((c) => ({ ...c, [campo]: valor }));
    setSalvo(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const r = await saveIrisSettings(form);
      if (r.ok) setSalvo(true);
      else setErro(r.error);
    });
  }

  const taxa =
    stats.conversas > 0 ? Math.round((stats.resolvidas / stats.conversas) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Íris"
        subtitle="A assistente que atende o paciente no WhatsApp"
        action={
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleIris(!cfg.active);
                set("active", !cfg.active);
              })
            }
            className={`btn ${cfg.active ? "btn-secondary" : "btn-primary"}`}
          >
            {cfg.active ? "Desligar a Íris" : "Ligar a Íris"}
          </button>
        }
      />

      {!apiConfigured && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong className="font-semibold">A chave da API não está configurada.</strong> Sem
            ela a Íris não responde. Defina <code>ANTHROPIC_API_KEY</code> no ambiente.
          </p>
        </div>
      )}

      {!cfg.active && (
        <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong className="font-semibold">A Íris está desligada.</strong> Toda conversa que
            chegar vai direto para a equipe, sem resposta automática.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversas em 30 dias"
          value={String(stats.conversas)}
          hint={`${stats.respostas} respostas da Íris`}
        />
        <StatCard
          label="Resolvidas sem a equipe"
          value={`${taxa}%`}
          hint={`${stats.resolvidas} de ${stats.conversas}`}
        />
        <StatCard
          label="Passadas para a equipe"
          value={String(stats.transferidas)}
          hint="aguardando ou já atendidas"
        />
        <StatCard
          label="Agendamentos pela Íris"
          value={String(stats.agendamentos)}
          hint="marcados direto na agenda"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-4">
          <Card>
            <CardTitle>Como ela conversa</CardTitle>

            <input type="hidden" name="active" value={cfg.active ? "on" : "off"} />

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Tom</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TONS.map((t) => (
                    <label
                      key={t.key}
                      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                        cfg.tone === t.key
                          ? "border-accent bg-accent-soft"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={t.key}
                        checked={cfg.tone === t.key}
                        onChange={() => set("tone", t.key)}
                        className="sr-only"
                      />
                      <p className="text-sm font-medium text-zinc-900">{t.label}</p>
                      <p className="mt-0.5 text-xs leading-snug text-zinc-500">{t.hint}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="greeting" className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Apresentação na primeira mensagem
                </label>
                <input
                  id="greeting"
                  name="greeting"
                  value={cfg.greeting ?? ""}
                  onChange={(e) => set("greeting", e.target.value)}
                  placeholder="Oi! Sou a Íris, assistente virtual da clínica."
                  className="field"
                />
              </div>

              <div>
                <label
                  htmlFor="extraInstructions"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Instruções da clínica
                </label>
                <textarea
                  id="extraInstructions"
                  name="extraInstructions"
                  rows={4}
                  value={cfg.extraInstructions ?? ""}
                  onChange={(e) => set("extraInstructions", e.target.value)}
                  placeholder="Ex.: não atendemos convênio Amil. Estacionamento é no prédio ao lado. Primeira consulta sempre com a Dra. Helena."
                  className="field"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Entra no fim do prompt. Vale para regras da casa, não para conduta clínica.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>O que ela pode fazer</CardTitle>

            <div className="mt-4 space-y-3">
              <Switch
                name="canSchedule"
                checked={cfg.canSchedule}
                onChange={(v) => set("canSchedule", v)}
                label="Marcar consulta sozinha"
                hint="Desligado, ela informa os horários livres mas chama a equipe para fechar."
              />

              <Switch
                name="answerOutsideHours"
                checked={cfg.answerOutsideHours}
                onChange={(v) => set("answerOutsideHours", v)}
                label="Responder fora do horário"
                hint={`A clínica atende das ${hhmm(clinicHours.opening)} às ${hhmm(
                  clinicHours.closing,
                )}.`}
              />

              {!cfg.answerOutsideHours && (
                <div className="pl-1">
                  <label
                    htmlFor="awayMessage"
                    className="mb-1.5 block text-xs font-medium text-zinc-500"
                  >
                    Mensagem fora do horário
                  </label>
                  <input
                    id="awayMessage"
                    name="awayMessage"
                    value={cfg.awayMessage ?? ""}
                    onChange={(e) => set("awayMessage", e.target.value)}
                    placeholder="Recebemos sua mensagem! Respondemos no horário comercial."
                    className="field"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Quando chamar a equipe</CardTitle>
            <p className="mt-1 text-xs text-zinc-400">
              Além disso ela já transfere sozinha em urgência, dor intensa, reclamação ou pedido
              do paciente.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="handoffKeywords"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Palavras que transferem na hora
                </label>
                <input
                  id="handoffKeywords"
                  name="handoffKeywords"
                  value={cfg.handoffKeywords ?? ""}
                  onChange={(e) => set("handoffKeywords", e.target.value)}
                  placeholder="advogado, processo, reembolso, ouvidoria"
                  className="field"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Separadas por vírgula. A transferência acontece antes de a IA ser chamada.
                </p>
              </div>

              <div>
                <label
                  htmlFor="maxAiMessages"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Limite de respostas por conversa
                </label>
                <input
                  id="maxAiMessages"
                  name="maxAiMessages"
                  type="number"
                  min={0}
                  max={50}
                  value={cfg.maxAiMessages}
                  onChange={(e) => set("maxAiMessages", Number(e.target.value))}
                  className="field field-auto w-32"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Passando disso a conversa vai para a equipe. 0 = sem limite.
                </p>
              </div>
            </div>
          </Card>

          {erro && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Salvando…" : "Salvar alterações"}
            </button>
            {salvo && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <IconCheck className="h-4 w-4" />
                Salvo
              </span>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <Card>
            <CardTitle>Situação</CardTitle>
            <div className="mt-4 space-y-2.5 text-sm">
              <Linha ok={apiConfigured} label="Chave da API" />
              <Linha ok={whatsappConfigured} label="Número do WhatsApp" />
              <Linha ok={cfg.active} label="Íris ligada" />
            </div>
            {!whatsappConfigured && (
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                Sem o número ligado, as respostas ficam registradas na conversa do paciente mas
                não saem da clínica.
              </p>
            )}
          </Card>

          <TestConsole config={cfg} disabled={!apiConfigured} />

          <Card>
            <CardTitle
              action={
                <Link href="/sistema/conversas" className="text-xs font-medium text-accent">
                  Ver conversas
                </Link>
              }
            >
              Por que ela chamou a equipe
            </CardTitle>

            {handoffs.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                Nenhuma conversa na mão da equipe agora.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {handoffs.map((h) => (
                  <li key={h.id} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-zinc-900">{h.contato}</p>
                    <p className="mt-0.5 text-xs leading-snug text-zinc-500">{h.motivo}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Ferramentas que ela usa</CardTitle>
            <ul className="mt-4 space-y-3 text-sm">
              <Ferramenta
                nome="consultar_horarios"
                texto="Lê a agenda de verdade para achar horário livre. Ela nunca inventa disponibilidade."
                ativa
              />
              <Ferramenta
                nome="agendar"
                texto="Cria a consulta e o cadastro do paciente. O banco ainda checa conflito na hora de gravar."
                ativa={cfg.canSchedule}
              />
              <Ferramenta
                nome="transferir_para_humano"
                texto="Passa a conversa para a equipe e registra o motivo."
                ativa
              />
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Linha({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-600">{label}</span>
      <Tag tone={ok ? "paid" : "overdue"}>{ok ? "pronto" : "pendente"}</Tag>
    </div>
  );
}

function Ferramenta({ nome, texto, ativa }: { nome: string; texto: string; ativa: boolean }) {
  return (
    <li className={ativa ? "" : "opacity-45"}>
      <div className="flex items-center gap-2">
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">{nome}</code>
        {!ativa && <span className="text-[11px] text-zinc-400">desligada</span>}
      </div>
      <p className="mt-1 text-xs leading-snug text-zinc-500">{texto}</p>
    </li>
  );
}

function Switch({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
          checked ? "bg-accent" : "bg-zinc-300"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </label>
  );
}

/**
 * Console de teste: conversa com a Íris usando a configuração que está na tela
 * (inclusive a que ainda não foi salva), sem gravar nada e sem marcar consulta
 * de verdade. É o jeito de conferir uma mudança antes de soltar no WhatsApp.
 */
function TestConsole({ config, disabled }: { config: IrisConfig; disabled: boolean }) {
  const [chat, setChat] = useState<{ role: "patient" | "ai"; text: string }[]>([]);
  const [texto, setTexto] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || carregando) return;

    const historico = [...chat, { role: "patient" as const, text: msg }];
    setChat(historico);
    setTexto("");
    setCarregando(true);
    setErro(null);

    try {
      const r = await fetch("/api/iris/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historico, config }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falhou.");
      setTools(data.tools ?? []);
      setChat([...historico, { role: "ai", text: data.reply || "(sem resposta)" }]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui falar com a Íris.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <CardTitle
        action={
          chat.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setChat([]);
                setTools([]);
              }}
              className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-700"
            >
              Limpar
            </button>
          ) : undefined
        }
      >
        Testar a Íris
      </CardTitle>
      <p className="mt-1 text-xs text-zinc-400">
        Usa o que está na tela agora. Nada é gravado e nenhuma consulta é marcada.
      </p>

      <div className="mt-4 max-h-72 space-y-2.5 overflow-y-auto">
        {chat.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-400">
            Escreva como se fosse o paciente.
          </p>
        )}
        {chat.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "patient"
                ? "ml-auto bg-accent text-white"
                : "bg-zinc-100 text-zinc-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {carregando && <p className="text-xs text-zinc-400">Íris está digitando…</p>}
      </div>

      {tools.length > 0 && (
        <p className="mt-3 text-xs text-zinc-400">
          Ferramentas usadas: {[...new Set(tools)].join(", ")}
        </p>
      )}

      {erro && <p className="mt-3 text-xs text-rose-600">{erro}</p>}

      <form onSubmit={enviar} className="mt-3 flex items-center gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Configure a chave da API" : "Oi, quanto custa uma limpeza?"}
          className="field field-sm"
        />
        <button
          type="submit"
          disabled={disabled || carregando}
          aria-label="Enviar"
          className="btn btn-primary shrink-0 px-3"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
        <IconRobot className="h-3.5 w-3.5" />
        As respostas aqui consomem a mesma chave da API do atendimento.
      </p>
    </Card>
  );
}

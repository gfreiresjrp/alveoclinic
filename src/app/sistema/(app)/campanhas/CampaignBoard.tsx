"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Card, PageHeader, Tag, Dialog } from "@/components/app/ui";
import { IconAlert, IconArrowRight } from "@/components/Icons";
import { toggleCampaign, runCampaign, updateCampaign } from "./actions";

type Campaign = {
  id: string;
  kind: string;
  name: string;
  description: string;
  template: string;
  active: boolean;
  config: string | null;
  lastRunAt: string | null;
  audience: { name: string; phone: string; reason: string }[];
  audienceTotal: number;
};

/**
 * Ilustrações do unDraw (undraw.co) — livres, sem atribuição obrigatória e sem
 * marca d'água. Ficam em public/illustrations e já foram recoloridas para o
 * azul do sistema.
 */
const ILLUSTRATIONS: Record<string, string> = {
  birthday: "/illustrations/birthday.svg",
  recall: "/illustrations/recall.svg",
  reactivation: "/illustrations/reactivation.svg",
  overdue: "/illustrations/overdue.svg",
  satisfaction: "/illustrations/satisfaction.svg",
  custom: "/illustrations/custom.svg",
};

const VARIABLES = ["paciente", "nome_completo", "clinica", "valor", "ultima_visita", "meses"];

export function CampaignBoard({
  campaigns,
  connected,
}: {
  campaigns: Campaign[];
  connected: boolean;
}) {
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const activeCount = campaigns.filter((c) => c.active).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campanhas"
        subtitle={`${activeCount} de ${campaigns.length} ativas · o público é recalculado a cada visita`}
      />

      {!connected && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            O WhatsApp não está conectado. As mensagens ficam registradas na conversa de cada
            paciente, mas não saem até configurar o número da clínica.
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {result}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => {
          const art = ILLUSTRATIONS[campaign.kind];

          return (
            <Card key={campaign.id} className="flex flex-col">
              <div className="relative">
                <div className="grid h-36 place-items-center rounded-lg bg-zinc-50">
                  {art && (
                    <Image
                      src={art}
                      alt=""
                      width={220}
                      height={130}
                      className="max-h-28 w-auto"
                      unoptimized
                    />
                  )}
                </div>
                <span className="absolute right-2 top-2">
                  <Tag tone={campaign.active ? "done" : "pending"}>
                    {campaign.active ? "Ativa" : "Desligada"}
                  </Tag>
                </span>
              </div>

              <h2 className="font-display mt-4 text-base font-semibold text-zinc-900">
                {campaign.name}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                {campaign.description}
              </p>

              <button
                type="button"
                onClick={() => setPreview(campaign)}
                className="mt-4 flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {campaign.audienceTotal === 0
                  ? "Ninguém no público hoje"
                  : `${campaign.audienceTotal} ${campaign.audienceTotal === 1 ? "paciente" : "pacientes"} hoje`}
                <IconArrowRight className="h-3.5 w-3.5" />
              </button>

              <p className="mt-3 line-clamp-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
                {campaign.template}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleCampaign(campaign.id, !campaign.active);
                    })
                  }
                  className={`btn ${campaign.active ? "btn-secondary" : "btn-primary"}`}
                >
                  {campaign.active ? "Desligar" : "Ativar"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(campaign)}
                  className="btn btn-secondary"
                >
                  Editar
                </button>

                <button
                  type="button"
                  disabled={pending || campaign.audienceTotal === 0 || !campaign.active}
                  title={
                    !campaign.active
                      ? "Ative a campanha para poder enviar"
                      : campaign.audienceTotal === 0
                        ? "Ninguém no público hoje"
                        : "Enviar agora"
                  }
                  onClick={() =>
                    startTransition(async () => {
                      const r = await runCampaign(campaign.id);
                      if (r.error) {
                        setResult(r.error);
                        return;
                      }
                      const total = r.total ?? 0;
                      const skipped = r.skipped ?? 0;
                      setResult(
                        `${campaign.name}: ${total} ${total === 1 ? "mensagem gerada" : "mensagens geradas"}` +
                          (skipped > 0 ? ` · ${skipped} já tinham recebido hoje` : "") +
                          (r.connected ? "" : " · WhatsApp desconectado, nada saiu"),
                      );
                    })
                  }
                  className="btn btn-secondary ml-auto"
                >
                  Enviar agora
                </button>
              </div>

              {campaign.lastRunAt && (
                <p className="mt-3 text-[11px] text-zinc-400">
                  Último envio em{" "}
                  {new Date(campaign.lastRunAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {preview && (
        <Dialog title={`Público de ${preview.name}`} onClose={() => setPreview(null)}>
          <p className="mt-2 text-sm text-zinc-500">
            {preview.audienceTotal === 0
              ? "Ninguém se encaixa nos critérios hoje."
              : `${preview.audienceTotal} no total${preview.audienceTotal > 8 ? " — mostrando os 8 primeiros" : ""}.`}
          </p>

          <div className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {preview.audience.map((t) => (
              <div key={t.phone} className="px-4 py-2.5">
                <p className="text-sm text-zinc-900">{t.name}</p>
                <p className="text-xs text-zinc-500">
                  {t.phone} · {t.reason}
                </p>
              </div>
            ))}
          </div>
        </Dialog>
      )}

      {editing && (
        <EditDialog campaign={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EditDialog({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [template, setTemplate] = useState(campaign.template);
  const [name, setName] = useState(campaign.name);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const months = (() => {
    try {
      return Number(JSON.parse(campaign.config ?? "{}").months ?? 0);
    } catch {
      return 0;
    }
  })();
  const [monthsValue, setMonthsValue] = useState(months);

  const usesMonths = ["recall", "reactivation", "custom"].includes(campaign.kind);

  function save() {
    startTransition(async () => {
      const r = await updateCampaign(campaign.id, {
        name,
        template,
        months: usesMonths ? monthsValue : undefined,
      });
      if (r?.error) setError(r.error);
      else onClose();
    });
  }

  return (
    <Dialog title="Editar campanha" onClose={onClose}>
      <div className="mt-5 space-y-4">
        <div>
          <label className="label-field" htmlFor="campaign-name">
            Nome
          </label>
          <input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </div>

        {usesMonths && (
          <div>
            <label className="label-field" htmlFor="campaign-months">
              Meses sem vir à clínica
            </label>
            <input
              id="campaign-months"
              type="number"
              min={0}
              max={60}
              value={monthsValue}
              onChange={(e) => setMonthsValue(Number(e.target.value))}
              className="field"
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              Zero inclui todo paciente sem retorno marcado.
            </p>
          </div>
        )}

        <div>
          <label className="label-field" htmlFor="campaign-template">
            Mensagem
          </label>
          <textarea
            id="campaign-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={5}
            className="field"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTemplate((t) => `${t}{${v}}`)}
                className="cursor-pointer rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 hover:border-accent hover:text-accent"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary">
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

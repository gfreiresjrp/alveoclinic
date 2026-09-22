"use client";

import { useState, useTransition } from "react";
import { Card, CardTitle, Dialog, EmptyState, PageHeader, StatCard, Tag } from "@/components/app/ui";
import { IconPlus, IconSearch, IconAlert } from "@/components/Icons";
import { shortDate } from "@/lib/format";
import { createItem, registerMove, toggleItem } from "./actions";

type Item = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  supplier: string | null;
  active: boolean;
};

type Move = {
  id: string;
  kind: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  userName: string;
  itemName: string;
  unit: string;
};

const MOVE_LABEL: Record<string, string> = {
  in: "Entrada",
  out: "Saída",
  adjust: "Acerto",
};

export function StockBoard({ items, moves }: { items: Item[]; moves: Move[] }) {
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<Item | null>(null);
  const [term, setTerm] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [pending, startTransition] = useTransition();

  const ativos = items.filter((i) => i.active);
  const baixos = ativos.filter((i) => i.quantity <= i.minQuantity);
  const zerados = ativos.filter((i) => i.quantity === 0);

  const visiveis = items.filter((i) => {
    if (onlyLow && !(i.active && i.quantity <= i.minQuantity)) return false;
    if (!term) return true;
    const alvo = `${i.name} ${i.category ?? ""} ${i.supplier ?? ""}`.toLowerCase();
    return alvo.includes(term.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estoque"
        subtitle={`${ativos.length} ${ativos.length === 1 ? "item ativo" : "itens ativos"}`}
        action={
          <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
            <IconPlus className="h-4 w-4" />
            Novo item
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Itens cadastrados" value={String(ativos.length)} />
        <StatCard
          label="Precisam repor"
          value={String(baixos.length)}
          hint={baixos.length > 0 ? "no mínimo ou abaixo" : "tudo acima do mínimo"}
          tone={baixos.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Zerados"
          value={String(zerados.length)}
          tone={zerados.length > 0 ? "danger" : "default"}
        />
      </div>

      {baixos.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong className="font-semibold">
              {baixos.length} {baixos.length === 1 ? "item precisa" : "itens precisam"}
            </strong>{" "}
            de reposição: {baixos.slice(0, 4).map((i) => i.name).join(", ")}
            {baixos.length > 4 && ` e mais ${baixos.length - 4}`}.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar item, categoria ou fornecedor"
            className="field field-sm field-icon"
          />
        </div>

        <button
          type="button"
          onClick={() => setOnlyLow((v) => !v)}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
            onlyLow
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
          }`}
        >
          Só os que precisam repor
        </button>

        <span className="ml-auto text-[13px] text-zinc-400">
          {visiveis.length} de {items.length}
        </span>
      </div>

      <Card className="p-0">
        {visiveis.length === 0 ? (
          <div className="p-5">
            <EmptyState
              art="/illustrations/no-data.svg"
              title="Nenhum item"
              text="Cadastre o primeiro material do consultório."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_120px_96px_88px_212px] items-center gap-4 border-b border-zinc-100 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              <span>Item</span>
              <span>Categoria</span>
              <span className="text-right">Saldo</span>
              <span className="text-right">Mínimo</span>
              <span />
            </div>

            <div className="divide-y divide-zinc-100">
              {visiveis.map((item) => {
                const baixo = item.quantity <= item.minQuantity;
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_120px_96px_88px_212px] items-center gap-4 px-5 py-3 ${
                      item.active ? "" : "opacity-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-900">{item.name}</p>
                      {item.supplier && (
                        <p className="truncate text-xs text-zinc-400">{item.supplier}</p>
                      )}
                    </div>

                    <span className="truncate text-xs text-zinc-500">
                      {item.category ?? "—"}
                    </span>

                    <span className="text-right">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          item.quantity === 0
                            ? "text-rose-600"
                            : baixo
                              ? "text-amber-700"
                              : "text-zinc-900"
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <span className="ml-1 text-xs text-zinc-400">{item.unit}</span>
                    </span>

                    <span className="text-right text-xs tabular-nums text-zinc-500">
                      {item.minQuantity}
                    </span>

                    <div className="flex items-center justify-end gap-1.5">
                      {baixo && item.active && (
                        <span className="shrink-0">
                          <Tag tone="due">repor</Tag>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setMoving(item)}
                        className="cursor-pointer shrink-0 whitespace-nowrap rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-accent hover:text-accent"
                      >
                        Movimentar
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await toggleItem(item.id, !item.active);
                          })
                        }
                        className="cursor-pointer shrink-0 whitespace-nowrap text-[11px] text-zinc-400 hover:text-zinc-700"
                      >
                        {item.active ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Card className="p-0">
        <div className="px-5 py-4">
          <CardTitle>Últimas movimentações</CardTitle>
        </div>

        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {moves.length === 0 ? (
            <EmptyState icon={<IconAlert className="h-9 w-9" />} title="Nenhuma movimentação" />
          ) : (
            moves.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5">
                <span className="w-20 shrink-0 text-xs text-zinc-500">
                  {shortDate(m.createdAt.slice(0, 10))}
                </span>
                <Tag tone={m.kind === "in" ? "done" : m.kind === "out" ? "late" : "pending"}>
                  {MOVE_LABEL[m.kind]}
                </Tag>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                  {m.itemName}
                  {m.note && <span className="text-zinc-400"> · {m.note}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-900">
                  {m.kind === "out" ? "−" : m.kind === "in" ? "+" : "="}
                  {m.quantity} {m.unit}
                </span>
                <span className="w-32 shrink-0 truncate text-right text-xs text-zinc-400">
                  {m.userName}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      {creating && <CreateDialog onClose={() => setCreating(false)} />}
      {moving && <MoveDialog item={moving} onClose={() => setMoving(null)} />}
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "un",
    quantity: "0",
    minQuantity: "0",
    supplier: "",
  });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <Dialog title="Novo item de estoque" onClose={onClose}>
      <div className="mt-5 space-y-4">
        <div>
          <label className="label-field" htmlFor="stk-name">
            Item
          </label>
          <input
            id="stk-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="field"
            placeholder="Luva de procedimento M"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="stk-category">
              Categoria
            </label>
            <input
              id="stk-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="field"
              placeholder="Descartáveis"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="stk-unit">
              Unidade
            </label>
            <select
              id="stk-unit"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className="field"
            >
              {["un", "cx", "par", "ml", "g", "kit"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="stk-qty">
              Quantidade atual
            </label>
            <input
              id="stk-qty"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="stk-min">
              Mínimo antes de repor
            </label>
            <input
              id="stk-min"
              type="number"
              min={0}
              value={form.minQuantity}
              onChange={(e) => set("minQuantity", e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="stk-supplier">
            Fornecedor
          </label>
          <input
            id="stk-supplier"
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            className="field"
            placeholder="Dental Cremer"
          />
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
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await createItem(form);
                if (result?.error) setError(result.error);
                else onClose();
              })
            }
            className="btn btn-primary"
          >
            {pending ? "Salvando…" : "Cadastrar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function MoveDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const [kind, setKind] = useState<"in" | "out" | "adjust">("out");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog title={item.name} onClose={onClose}>
      <p className="mt-2 text-sm text-zinc-500">
        Saldo atual: <strong className="font-semibold text-zinc-900">{item.quantity} {item.unit}</strong>
        {" · "}mínimo {item.minQuantity}
      </p>

      <div className="mt-5 space-y-4">
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {(
            [
              ["out", "Saída"],
              ["in", "Entrada"],
              ["adjust", "Acerto"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                kind === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="label-field" htmlFor="mov-qty">
            {kind === "adjust" ? "Quantidade contada" : "Quantidade"}
          </label>
          <input
            id="mov-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="field"
          />
          {kind === "adjust" && (
            <p className="mt-1.5 text-xs text-zinc-400">
              O saldo passa a ser exatamente este número.
            </p>
          )}
        </div>

        <div>
          <label className="label-field" htmlFor="mov-note">
            Observação
          </label>
          <input
            id="mov-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
            placeholder={kind === "in" ? "Compra fornecedor X" : "Uso no atendimento"}
          />
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
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await registerMove(item.id, kind, quantity, note);
                if (result?.error) setError(result.error);
                else onClose();
              })
            }
            className="btn btn-primary"
          >
            {pending ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

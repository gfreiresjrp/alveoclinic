"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CardTitle, Dialog, EmptyState, Tag } from "@/components/app/ui";
import { IconDoc, IconTrash } from "@/components/Icons";
import { shortDate } from "@/lib/format";
import { draftDocument, saveDocument, deleteDocument } from "./documentActions";

type Doc = {
  id: string;
  kind: string;
  title: string;
  createdAt: string;
  authorName: string;
};

type Model = {
  kind: string;
  label: string;
  description: string;
  fields: { name: string; label: string; placeholder?: string }[];
};

export function Documents({
  patientId,
  documents,
  models,
}: {
  patientId: string;
  documents: Doc[];
  models: Model[];
}) {
  const [creating, setCreating] = useState<Model | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const labelOf = (kind: string) => models.find((m) => m.kind === kind)?.label ?? kind;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <CardTitle>Emitir documento</CardTitle>
        <p className="mt-1 text-sm text-zinc-500">
          O sistema monta um rascunho com os dados da clínica e do paciente. Você revisa,
          salva e imprime.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => (
            <button
              key={model.kind}
              type="button"
              onClick={() => setCreating(model)}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-accent"
            >
              <span className="icon-badge h-8 w-8 shrink-0">
                <IconDoc className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-zinc-900">{model.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  {model.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-0">
        <div className="px-5 py-4">
          <CardTitle>Emitidos</CardTitle>
        </div>

        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {documents.length === 0 ? (
            <EmptyState
              icon={<IconDoc className="h-9 w-9" />}
              title="Nenhum documento emitido"
              text="Recibos, atestados e encaminhamentos aparecem aqui."
            />
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <Tag tone="pending">{labelOf(doc.kind)}</Tag>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-900">{doc.title}</p>
                  <p className="text-xs text-zinc-400">
                    {shortDate(doc.createdAt.slice(0, 10))} · {doc.authorName}
                  </p>
                </div>

                <Link
                  href={`/sistema/documentos/${doc.id}`}
                  target="_blank"
                  className="btn btn-secondary py-1.5 text-xs"
                >
                  Abrir e imprimir
                </Link>

                {confirmDelete === doc.id ? (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDocument(doc.id, patientId);
                          setConfirmDelete(null);
                        })
                      }
                      className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="cursor-pointer px-1 text-[11px] text-zinc-400"
                    >
                      não
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(doc.id)}
                    aria-label="Excluir documento"
                    className="cursor-pointer rounded-md p-1.5 text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {creating && (
        <CreateDialog
          patientId={patientId}
          model={creating}
          onClose={() => setCreating(null)}
        />
      )}
    </div>
  );
}

function CreateDialog({
  patientId,
  model,
  onClose,
}: {
  patientId: string;
  model: Model;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const result = await draftDocument(patientId, model.kind, values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError("");
      setTitle(result.title ?? model.label);
      setBody(result.body ?? "");
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveDocument(patientId, model.kind, title, body);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Dialog title={model.label} onClose={onClose}>
      <div className="mt-5 space-y-4">
        {model.fields.map((field) => (
          <div key={field.name}>
            <label className="label-field" htmlFor={`doc-${field.name}`}>
              {field.label}
            </label>
            {field.name === "prescricao" ? (
              <textarea
                id={`doc-${field.name}`}
                rows={3}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                className="field"
                placeholder={field.placeholder}
              />
            ) : (
              <input
                id={`doc-${field.name}`}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                className="field"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        <button type="button" onClick={generate} disabled={pending} className="btn btn-secondary">
          {pending ? "Gerando…" : body ? "Gerar de novo" : "Gerar rascunho"}
        </button>

        {body && (
          <>
            <div>
              <label className="label-field" htmlFor="doc-title">
                Título
              </label>
              <input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="label-field" htmlFor="doc-body">
                Texto do documento
              </label>
              <textarea
                id="doc-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="field font-mono text-[13px]"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Revise antes de salvar — é exatamente este texto que vai para a impressão.
              </p>
            </div>
          </>
        )}

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
            onClick={save}
            disabled={pending || !body}
            className="btn btn-primary"
          >
            {pending ? "Salvando…" : "Salvar documento"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

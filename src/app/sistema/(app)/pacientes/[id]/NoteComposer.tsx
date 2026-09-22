"use client";

import { useState, useTransition } from "react";
import { addClinicalNote } from "../actions";

export function NoteComposer({ patientId }: { patientId: string }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    const content = text.trim();
    if (content.length < 3) return;
    startTransition(async () => {
      await addClinicalNote(patientId, content);
      setText("");
    });
  }

  return (
    <div className="mt-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Registrar evolução do atendimento de hoje…"
        className="field"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending || text.trim().length < 3}
        className="btn btn-primary mt-2.5"
      >
        {pending ? "Salvando…" : "Registrar evolução"}
      </button>
    </div>
  );
}

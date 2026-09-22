"use client";

import { useEffect, useRef, useState } from "react";
import { IconMic, IconTrash, IconSend } from "@/components/Icons";
import { sendStaffAudio } from "./actions";

/** Formatos que o navegador pode gerar, na ordem de preferência do servidor. */
const CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function AudioRecorder({
  conversationId,
  onError,
}: {
  conversationId: string;
  onError: (message: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sending, setSending] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);

  // Cronômetro da gravação.
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 200);
    return () => clearInterval(timer);
  }, [recording]);

  // Se o componente sair do ar no meio da gravação, solta o microfone.
  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    const mimeType = pickMimeType();
    if (!mimeType) {
      onError("Este navegador não grava áudio.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError("Permissão de microfone negada.");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    discardRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const durationMs = Date.now() - startedAtRef.current;

      if (discardRef.current || chunksRef.current.length === 0 || durationMs < 700) {
        setElapsed(0);
        return;
      }

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";

      const formData = new FormData();
      formData.append("audio", new File([blob], `audio.${extension}`, { type: mimeType }));
      formData.append("durationMs", String(durationMs));

      setSending(true);
      const result = await sendStaffAudio(conversationId, formData);
      setSending(false);
      setElapsed(0);
      if (result?.error) onError(result.error);
    };

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    recorder.start();
    setRecording(true);
  }

  function finish(discard: boolean) {
    discardRef.current = discard;
    recorderRef.current?.stop();
    setRecording(false);
  }

  if (sending) {
    return (
      <span className="shrink-0 px-3 text-xs text-slate-400">enviando áudio…</span>
    );
  }

  if (recording) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => finish(true)}
          aria-label="Descartar gravação"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors hover:text-rose-600"
        >
          <IconTrash className="h-5 w-5" />
        </button>

        <span className="flex items-center gap-2 text-sm tabular-nums text-slate-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          {clock(elapsed)}
        </span>

        <button
          type="button"
          onClick={() => finish(false)}
          aria-label="Enviar áudio"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[#25d366] text-white transition-colors hover:bg-[#1eb855]"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label="Gravar áudio"
      className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors hover:text-slate-600"
    >
      <IconMic className="h-5 w-5" />
    </button>
  );
}

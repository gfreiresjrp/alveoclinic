"use client";

import { useEffect, useRef, useState } from "react";
import { IconPlay, IconPause } from "@/components/Icons";

function clock(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Barrinhas estáticas: só dão a forma de um áudio, não são a onda real. */
const BARS = [3, 6, 10, 7, 12, 9, 14, 8, 5, 11, 7, 13, 6, 9, 4, 10, 7, 12, 5, 8, 11, 6, 9, 4];

export function AudioMessage({
  messageId,
  durationMs,
}: {
  messageId: string;
  durationMs: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(durationMs ? durationMs / 1000 : 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) setTotal(audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audio.currentTime = ((event.clientX - rect.left) / rect.width) * total;
    setCurrent(audio.currentTime);
  }

  const progress = total ? Math.min(current / total, 1) : 0;

  return (
    <div className="flex min-w-[220px] items-center gap-3 py-0.5">
      <audio ref={audioRef} src={`/api/media/${messageId}`} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Reproduzir"}
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white/70 text-slate-700 transition-colors hover:bg-white"
      >
        {playing ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4 translate-x-px" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          onClick={seek}
          role="presentation"
          className="flex h-6 cursor-pointer items-center gap-[2px]"
        >
          {BARS.map((height, i) => (
            <span
              key={i}
              className="w-[2px] shrink-0 rounded-full transition-colors"
              style={{
                height: `${height + 4}px`,
                backgroundColor:
                  i / BARS.length <= progress ? "rgba(17,27,33,.65)" : "rgba(17,27,33,.22)",
              }}
            />
          ))}
        </div>
        <span className="mt-0.5 block text-[11px] tabular-nums text-[rgba(17,27,33,.45)]">
          {clock(playing || current > 0 ? current : total)}
        </span>
      </div>
    </div>
  );
}

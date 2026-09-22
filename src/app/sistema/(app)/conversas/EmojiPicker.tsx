"use client";

import { useEffect, useRef, useState } from "react";
import { IconEmoji } from "@/components/Icons";

/** Conjunto enxuto, agrupado — cobre o que se usa numa conversa de clínica. */
const GROUPS: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: "Rostos",
    icon: "🙂",
    emojis: [
      "😀","😃","😄","😁","😅","😂","🙂","😊","😇","🙃","😉","😌","😍","🥰","😘","😗",
      "😙","😚","😋","😛","🤗","🤭","🤔","🤐","😐","😶","😏","🙄","😴","😪","😮","😯",
      "😬","😥","😢","😭","😤","😠","🥺","😳","🤒","🤕","🤧","😷","🤯","🥳","😎","🤓",
    ],
  },
  {
    label: "Gestos",
    icon: "👍",
    emojis: [
      "👍","👎","👌","🙏","👏","🙌","🤝","✌️","🤞","💪","👋","🤙","☝️","👉","👈","✋",
      "🖐️","🤘","💅","👊","✊","🫶","❤️","🧡","💛","💚","💙","💜","🤍","💔","💖","✨",
    ],
  },
  {
    label: "Saúde",
    icon: "🦷",
    emojis: [
      "🦷","🪥","😁","💉","💊","🩺","🏥","🩹","🧼","🫧","🍏","🥦","💧","🧊","⚕️","🧑‍⚕️",
    ],
  },
  {
    label: "Geral",
    icon: "📅",
    emojis: [
      "📅","📆","⏰","⏳","✅","❌","⚠️","📍","📞","📱","💬","📝","📄","💰","💳","🎉",
      "🎈","🌟","🔥","☀️","🌙","🚗","🚌","🏠","🔔","🔕","👀","🤩","🙇","🫡","🆗","🔝",
    ],
  },
];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc, como qualquer popover.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Emoji"
        aria-expanded={open}
        className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors ${
          open ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <IconEmoji className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 z-20 w-[320px] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex gap-1 border-b border-slate-100 p-1.5">
            {GROUPS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setGroup(i)}
                title={g.label}
                aria-label={g.label}
                className={`h-8 flex-1 cursor-pointer rounded-lg text-base transition-colors ${
                  group === i ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                {g.icon}
              </button>
            ))}
          </div>

          <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {GROUPS[group].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onPick(emoji)}
                className="h-9 cursor-pointer rounded-lg text-xl leading-none transition-colors hover:bg-slate-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

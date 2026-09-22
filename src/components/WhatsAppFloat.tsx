import { IconWhatsApp } from "./Icons";
import { whatsappHref } from "@/lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-lime text-navy shadow-[0_14px_40px_-10px_rgba(198,227,26,0.8)] transition-transform hover:scale-105"
    >
      <span className="absolute inset-0 rounded-full bg-lime/40 animate-pulse-ring" />
      <IconWhatsApp className="relative h-7 w-7" />
    </a>
  );
}

import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const description = `${site.ai} é a IA de pré-atendimento da ${site.brand}. Ela responde os pacientes no WhatsApp 24 horas por dia, tira dúvidas, qualifica e agenda direto na agenda da clínica — e chama a sua equipe quando o caso precisa de gente.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `IA de pré-atendimento para clínicas no WhatsApp | ${site.brand}`,
    template: `%s | ${site.brand}`,
  },
  description,
  keywords: [
    "IA para clínicas",
    "pré-atendimento WhatsApp",
    "agendamento automático clínica",
    "sistema de gestão para clínicas",
    "prontuário eletrônico",
    site.brand,
  ],
  openGraph: {
    title: `${site.brand} — ${site.tagline}`,
    description,
    url: site.url,
    siteName: site.brand,
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/alveo-icon.png", width: 512, height: 512, alt: site.brand }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand} — ${site.tagline}`,
    description,
    images: ["/brand/alveo-icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#13294b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo escreve data-theme no <html>
    // antes da hidratação, então o atributo sempre difere do HTML do servidor.
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col overflow-x-hidden">
        {/*
          Aplica o tema salvo antes da primeira pintura. Sem isso, quem usa o
          modo escuro vê um flash branco a cada navegação.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('alveo-tema');if(t)document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

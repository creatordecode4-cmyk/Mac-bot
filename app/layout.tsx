import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegisterSW } from "@/components/Pwa";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const description = "MAC Bot is a free, premium AI assistant that speaks 100+ languages, thinks like a founder and opens your apps: WhatsApp, Mail, Calendar, Maps and more.";

export const metadata: Metadata = {
  title: { default: "MAC Bot — Your smartest little friend", template: "%s · MAC Bot" },
  description,
  applicationName: "MAC Bot",
  appleWebApp: { capable: true, title: "MAC Bot", statusBarStyle: "black-translucent" },
  openGraph: { title: "MAC Bot — Your smartest little friend", description, type: "website", siteName: "MAC Bot" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#07070C",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans text-pearl antialiased">
        <div aria-hidden className="aurora">
          <span />
          <span />
          <span />
        </div>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

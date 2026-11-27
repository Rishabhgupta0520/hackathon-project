import type { Metadata } from "next";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "GhostWire — Zero-Knowledge Edge PII Firewall & Data Privacy Platform",
  description: "Editorial scroll-choreographed Zero-Knowledge PII firewall, differential privacy proxy, and client-side cryptographic vaulting.",
};

import { MotionCursor } from "@/components/MotionCursor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFDFD] text-[#141414] font-sans selection:bg-[#627E4A]/15 selection:text-[#627E4A]">
        {children}
        <MotionCursor />
      </body>
    </html>
  );
}

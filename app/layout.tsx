import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Veyra Creatives & Digital Lab",
  description: "Digital marketing agency and creative lab.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 Added data-scroll-behavior here
    <html lang="en" data-scroll-behavior="smooth">
      {/* REMOVED: style={{ fontFamily: "var(--font-body)" }} — next/font handles this via CSS variable */}
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} bg-[#0B0D12] text-[#F5F3EE]`}
      >
        {children}
      </body>
    </html>
  );
}
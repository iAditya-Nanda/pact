import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PACT | Proactive Agent for Coordinated Tasks",
  description: "Autonomous cross-application workflow orchestrator with verified tool execution and human-in-the-loop safety controls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafd] text-[#1f1f1f]">
        {children}
      </body>
    </html>
  );
}

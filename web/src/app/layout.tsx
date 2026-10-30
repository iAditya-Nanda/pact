import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('pact_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.body && document.body.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.body && document.body.classList.remove('dark');
                }
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafd] dark:bg-[#111318] text-[#1f1f1f] dark:text-[#e2e2e6] transition-colors">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

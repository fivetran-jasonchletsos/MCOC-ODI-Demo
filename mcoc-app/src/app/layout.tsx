import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCOC Insights — advanced roster analysis",
  description: "Counter-coverage gaps, ability supercounters, debuff-stack chains, and rank-up math for Marvel Contest of Champions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <nav className="border-b border-ink-mid bg-ink-soft/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-display text-lg font-bold tracking-wide">
              MCOC <span className="text-chrome-soft font-normal">// Insights</span>
            </Link>
            <div className="flex items-center gap-4 text-sm text-chrome-soft">
              <Link href="/" className="hover:text-chrome">Champions</Link>
              <Link href="/roster/" className="hover:text-chrome">My Roster</Link>
              <Link href="/insights/" className="hover:text-chrome">Insights</Link>
              <Link href="/abilities/" className="hover:text-chrome">Abilities</Link>
              <Link href="/story/9-4-6/" className="hover:text-chrome">9.4.6 Boss</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-ink-mid mt-16 py-6 text-center text-xs text-chrome-dim">
          ODI demo · data from the MCOC fandom wiki · not affiliated with Kabam
        </footer>
      </body>
    </html>
  );
}

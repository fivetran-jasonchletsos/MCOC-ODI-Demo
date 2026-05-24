"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChampionGrid } from "@/components/ChampionGrid";
import { champions, supercounters, immunityPairs, debuffChains } from "@/lib/data";
import { loadRoster, saveRoster } from "@/lib/roster";
import { asset } from "@/lib/asset";
import type { RosterEntry } from "@/lib/types";

export default function HomePage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);

  useEffect(() => {
    setRoster(loadRoster());
  }, []);

  async function loadJasonRoster() {
    const url = asset("/data/jason_roster.json") || "/data/jason_roster.json";
    const res = await fetch(url);
    const entries = (await res.json()) as RosterEntry[];
    setRoster(entries);
    saveRoster(entries);
  }

  const ownedSlugs = new Set(roster.map((r) => r.slug));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          {champions.length} champions, {" "}
          <span className="text-cosmic">{supercounters.length} supercounter abilities</span>, {" "}
          <span className="text-tech">{immunityPairs.length} immunity pairs</span>, {" "}
          <span className="text-mystic">{debuffChains.length} debuff chains</span>.
        </h1>
        <p className="text-chrome-soft max-w-2xl">
          Click any champion for their top counters, the abilities they&apos;re weak to, and similar champions
          by ability profile. Load your roster to unlock coverage-gap analysis and rank-up math.
        </p>
        <div className="flex gap-3 pt-2 flex-wrap items-center">
          {roster.length === 0 ? (
            <button
              onClick={loadJasonRoster}
              className="px-4 py-2 bg-cosmic text-ink font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Load Jason&apos;s Roster (218)
            </button>
          ) : (
            <>
              <div className="px-4 py-2 bg-mystic/15 border border-mystic text-mystic font-semibold rounded-md">
                Roster loaded — {roster.length} champions owned
              </div>
              <Link href="/roster/" className="px-4 py-2 bg-cosmic text-ink font-semibold rounded-md hover:opacity-90 transition-opacity">
                Edit Roster
              </Link>
              <Link href="/story/9-4-6/" className="px-4 py-2 bg-skill text-ink font-semibold rounded-md hover:opacity-90 transition-opacity">
                9.4.6 Boss Counters
              </Link>
            </>
          )}
          <Link href="/insights/" className="px-4 py-2 border border-chrome-soft text-chrome rounded-md hover:bg-ink-soft transition-colors">
            See Insights
          </Link>
        </div>
        {roster.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 max-w-3xl">
            {(["Cosmic", "Tech", "Mutant", "Skill", "Science", "Mystic"] as const).map((cls) => {
              const n = roster.filter((r) => {
                const ch = champions.find((c) => c.slug === r.slug);
                return ch?.class === cls;
              }).length;
              const hex = { Cosmic: "#f6c83a", Tech: "#3aaaf6", Mutant: "#f6a23a", Skill: "#f6453a", Science: "#3af67a", Mystic: "#b53af6" }[cls];
              return (
                <div
                  key={cls}
                  className="rounded p-2 text-center border"
                  style={{ borderColor: hex, background: `${hex}15` }}
                >
                  <div className="font-display font-bold text-xl" style={{ color: hex }}>{n}</div>
                  <div className="text-[10px] uppercase text-chrome-soft">{cls}</div>
                </div>
              );
            })}
          </div>
        )}
      </header>
      <section>
        <h2 className="font-display text-xl font-semibold mb-3 text-chrome-soft uppercase tracking-wide">
          Champion Roster {roster.length > 0 && <span className="text-chrome-dim normal-case text-sm">— owned champions are highlighted</span>}
        </h2>
        <ChampionGrid ownedSlugs={ownedSlugs} />
      </section>
    </div>
  );
}

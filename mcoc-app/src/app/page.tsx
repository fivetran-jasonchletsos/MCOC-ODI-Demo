import { ChampionGrid } from "@/components/ChampionGrid";
import { champions, supercounters, immunityPairs, debuffChains } from "@/lib/data";

export default function HomePage() {
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
          Click any champion for their top counters, the abilities they're weak to, and similar champions
          by ability profile. Load your roster to unlock coverage-gap analysis and rank-up math.
        </p>
        <div className="flex gap-3 pt-2">
          <a href="/roster/" className="px-4 py-2 bg-cosmic text-ink font-semibold rounded-md hover:bg-cosmic-glow transition-colors">
            Load My Roster
          </a>
          <a href="/insights/" className="px-4 py-2 border border-chrome-soft text-chrome rounded-md hover:bg-ink-soft transition-colors">
            See Insights
          </a>
        </div>
      </header>
      <section>
        <h2 className="font-display text-xl font-semibold mb-3 text-chrome-soft uppercase tracking-wide">
          Champion Roster
        </h2>
        <ChampionGrid />
      </section>
    </div>
  );
}

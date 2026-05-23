import Link from "next/link";
import { abilities, championBySlug } from "@/lib/data";
import { CLASS_KEY } from "@/lib/types";

export default function AbilitiesPage() {
  const sorted = [...abilities].sort((a, b) => b.champion_count - a.champion_count);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold mb-2">Abilities</h1>
        <p className="text-chrome-soft text-sm max-w-2xl">
          {abilities.length} unique abilities across the roster. Click an ability to see every champion that
          brings it. Tagged abilities show what archetypes they counter or define.
        </p>
      </header>
      <div className="space-y-2">
        {sorted.map((a) => {
          const id = a.name.replace(/\s+/g, "-").toLowerCase();
          return (
            <div key={a.name} id={id} className="bg-ink-soft border border-ink-mid rounded p-3 scroll-mt-20">
              <div className="flex items-baseline gap-3 flex-wrap mb-1">
                <span className="font-display text-base font-semibold">{a.name}</span>
                <span className="text-xs text-chrome-soft">{a.champion_count} champions</span>
                {a.archetypes.map((ar) => (
                  <span key={ar} className="text-[10px] px-1.5 py-0.5 bg-ink border border-ink-mid rounded text-chrome-soft">
                    archetype: {ar}
                  </span>
                ))}
                {a.counters.map((c, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: c.strength === "strong" ? "rgba(58,246,122,0.18)" : "rgba(58,170,246,0.18)",
                      color: c.strength === "strong" ? "#3af67a" : "#3aaaf6",
                    }}>
                    counters {c.archetype}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {a.champions.slice(0, 20).map((s) => {
                  const c = championBySlug[s];
                  if (!c) return null;
                  const ck = c.class ? CLASS_KEY[c.class] : "";
                  return (
                    <Link key={s} href={`/champion/${s}/`}
                      className={`class-${ck} inline-block px-1.5 py-0.5 rounded text-[11px]`}
                      style={{ background: "color-mix(in srgb, var(--c) 16%, transparent)", color: "var(--c-glow)" }}>
                      {c.title}
                    </Link>
                  );
                })}
                {a.champions.length > 20 && (
                  <span className="text-chrome-dim text-xs self-center">+{a.champions.length - 20}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

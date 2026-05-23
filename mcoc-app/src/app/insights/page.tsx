import Link from "next/link";
import {
  supercounters,
  immunityPairs,
  debuffChains,
  championBySlug,
} from "@/lib/data";
import { CLASS_KEY } from "@/lib/types";

export default function InsightsPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-3xl font-bold mb-2">Insights</h1>
        <p className="text-chrome-soft text-sm max-w-2xl">
          Roster-agnostic analysis. Load your roster on the{" "}
          <Link href="/roster/" className="text-cosmic underline underline-offset-2">Roster</Link>{" "}
          page to see how these apply specifically to you.
        </p>
      </header>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-cosmic mb-3">
          Ability supercounters
        </h2>
        <p className="text-chrome-soft text-sm mb-4 max-w-2xl">
          Single abilities ranked by how many top-tier defenders they counter. The first 3–4 are the
          highest-leverage tools in the game — a champion who brings one of these unlocks the most matchups.
        </p>
        <div className="space-y-2">
          {supercounters.slice(0, 15).map((s) => (
            <div key={s.ability} className="bg-ink-soft border border-ink-mid rounded p-4">
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <span className="font-display text-xl font-bold text-cosmic">{s.ability}</span>
                <span className="text-sm text-chrome">
                  counters <b className="text-cosmic-glow">{s.countered_count}</b> top defenders
                </span>
                <span className="text-xs text-chrome-dim">
                  via {s.archetypes_countered.join(", ")}
                </span>
              </div>
              <div className="text-xs text-chrome-soft">
                <span className="text-chrome-dim uppercase mr-2">Bringers</span>
                {s.offerers.slice(0, 8).map((o) => {
                  const c = championBySlug[o];
                  if (!c) return null;
                  const ck = c.class ? CLASS_KEY[c.class] : "";
                  return (
                    <Link key={o} href={`/champion/${o}/`}
                      className={`class-${ck} inline-block mr-1.5 mb-1 px-2 py-0.5 rounded text-xs`}
                      style={{ background: "color-mix(in srgb, var(--c) 18%, transparent)", color: "var(--c-glow)" }}>
                      {c.title}
                    </Link>
                  );
                })}
                {s.offerers.length > 8 && (
                  <span className="text-chrome-dim text-xs ml-1">
                    +{s.offerers.length - 8} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-tech mb-3">
          Immunity complementarity pairs
        </h2>
        <p className="text-chrome-soft text-sm mb-4 max-w-2xl">
          Pairs of champions whose immunity profiles uniquely cover each other. The answer to "who do I
          bring as my second on team X."
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {immunityPairs.slice(0, 20).map((p, i) => {
            const ak = CLASS_KEY[p.a_class];
            const bk = CLASS_KEY[p.b_class];
            return (
              <div key={i} className="bg-ink-soft border border-ink-mid rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/champion/${p.a_slug}/`} className={`class-${ak} class-chip`}>{p.a_title}</Link>
                  <span className="text-chrome-dim text-xs">+</span>
                  <Link href={`/champion/${p.b_slug}/`} className={`class-${bk} class-chip`}>{p.b_title}</Link>
                </div>
                <div className="text-xs text-chrome-soft">
                  Together covers: <span className="text-chrome">{p.union.join(", ")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-mystic mb-3">
          Debuff-stack damage chains
        </h2>
        <p className="text-chrome-soft text-sm mb-4 max-w-2xl">
          Pairings where one champion applies a debuff that another exploits — compound damage opportunities
          most tier lists never surface.
        </p>
        <div className="space-y-3">
          {debuffChains.map((d) => (
            <div key={d.applier_ability + d.exploiter_ability}
              className="bg-ink-soft border border-mystic/40 rounded p-4">
              <div className="font-display text-lg mb-1">
                <span className="text-mystic-glow">{d.applier_ability}</span>
                <span className="text-chrome-dim mx-2">→</span>
                <span className="text-mystic-glow">{d.exploiter_ability}</span>
              </div>
              <div className="text-xs text-chrome-soft mb-2">{d.rationale}</div>
              <div className="text-xs">
                <div className="text-chrome-dim uppercase mb-1">Appliers</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {d.appliers.slice(0, 12).map((s) => {
                    const c = championBySlug[s];
                    if (!c) return null;
                    return (
                      <Link key={s} href={`/champion/${s}/`}
                        className="px-2 py-0.5 bg-ink border border-ink-mid rounded text-[11px] hover:border-mystic">
                        {c.title}
                      </Link>
                    );
                  })}
                  {d.appliers.length > 12 && <span className="text-chrome-dim self-center">+{d.appliers.length - 12}</span>}
                </div>
                <div className="text-chrome-dim uppercase mb-1">Exploiters</div>
                <div className="flex flex-wrap gap-1">
                  {d.exploiters.slice(0, 12).map((s) => {
                    const c = championBySlug[s];
                    if (!c) return null;
                    return (
                      <Link key={s} href={`/champion/${s}/`}
                        className="px-2 py-0.5 bg-ink border border-ink-mid rounded text-[11px] hover:border-mystic">
                        {c.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

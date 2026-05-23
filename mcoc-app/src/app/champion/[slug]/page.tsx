import Link from "next/link";
import { notFound } from "next/navigation";
import {
  champions,
  championBySlug,
  championCounters,
  immunityPairs,
} from "@/lib/data";
import { CLASS_KEY } from "@/lib/types";
import { asset } from "@/lib/asset";

export function generateStaticParams() {
  return champions.map((c) => ({ slug: c.slug }));
}

export default function ChampionPage({ params }: { params: { slug: string } }) {
  const c = championBySlug[params.slug];
  if (!c) return notFound();
  const cls = c.class ? CLASS_KEY[c.class] : "";
  const counters = championCounters[c.slug] || [];
  const myPairs = immunityPairs.filter(
    (p) => p.a_slug === c.slug || p.b_slug === c.slug
  ).slice(0, 6);

  return (
    <div className={`class-${cls} space-y-8`}>
      <header className="flex flex-col md:flex-row gap-6 items-start">
        <div
          className="w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden border-2"
          style={{ borderColor: "var(--c, #5a5a68)" }}
        >
          {c.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(c.portrait)} alt={c.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-chrome-dim">
              {c.title}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-bold" style={{ color: "var(--c-glow, #e6e6ef)" }}>
              {c.title}
            </h1>
            <span className="class-chip">{c.class}</span>
          </div>
          {c.signature_ability && (
            <div className="text-chrome-soft">
              <span className="text-chrome-dim text-xs uppercase tracking-wide">Signature ability</span>
              <div className="font-display text-lg" style={{ color: "var(--c-glow)" }}>{c.signature_ability}</div>
            </div>
          )}
          {c.tags.offensive.length > 0 && (
            <div className="text-sm">
              <span className="text-chrome-dim uppercase text-xs tracking-wide mr-2">Offensive</span>
              {c.tags.offensive.map((t) => (
                <span key={t} className="inline-block mr-2 px-2 py-0.5 bg-ink-soft border border-ink-mid rounded text-xs">{t}</span>
              ))}
            </div>
          )}
          {c.tags.defensive.length > 0 && (
            <div className="text-sm">
              <span className="text-chrome-dim uppercase text-xs tracking-wide mr-2">Defensive</span>
              {c.tags.defensive.map((t) => (
                <span key={t} className="inline-block mr-2 px-2 py-0.5 bg-ink-soft border border-ink-mid rounded text-xs">{t}</span>
              ))}
            </div>
          )}
          {c.tags.other.length > 0 && (
            <div className="text-xs text-chrome-soft">{c.tags.other.join(" · ")}</div>
          )}
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-chrome-soft mb-2">Abilities</h2>
          <div className="flex flex-wrap gap-1.5">
            {c.abilities.map((a) => (
              <Link
                key={a}
                href={`/abilities/#${a.replace(/\s+/g, "-").toLowerCase()}`}
                className="px-2.5 py-1 bg-ink-soft border border-ink-mid rounded text-xs hover:border-chrome-soft"
              >
                {a}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-chrome-soft mb-2">Immunities</h2>
          {c.immunities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {c.immunities.map((i) => (
                <span key={i} className="px-2.5 py-1 rounded text-xs"
                  style={{ background: "color-mix(in srgb, var(--c) 22%, transparent)", color: "var(--c-glow)" }}>
                  {i} Immunity
                </span>
              ))}
            </div>
          ) : (
            <div className="text-chrome-dim text-xs italic">none listed on the wiki</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
          Top counters to {c.title}
        </h2>
        {counters.length === 0 ? (
          <p className="text-chrome-dim italic text-sm">
            No archetype-based counters derivable from this champion's listed abilities.
            (The wiki's ability list may be sparse — analysis improves as we mine more wikitext.)
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {counters.slice(0, 10).map((co) => {
              const ck = CLASS_KEY[co.class];
              return (
                <Link
                  key={co.slug}
                  href={`/champion/${co.slug}/`}
                  className={`class-${ck} class-card p-3 block`}
                >
                  <div className="text-sm font-semibold">{co.title}</div>
                  <div className="text-xs text-chrome-soft mt-0.5">
                    {co.class} · score {co.score}
                  </div>
                  <div className="text-[10px] mt-1.5 space-y-0.5">
                    {co.class_bonus === "advantage" && (
                      <div style={{ color: "var(--c-glow)" }}>+ class advantage</div>
                    )}
                    {co.matched_abilities.slice(0, 3).map((m, i) => (
                      <div key={i} className="text-chrome-soft">
                        + {m.ability} <span className="text-chrome-dim">vs {m.archetype}</span>
                      </div>
                    ))}
                    {co.matched_immunities.map((m) => (
                      <div key={m} style={{ color: "var(--c-glow)" }}>
                        immune to {m}
                      </div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {myPairs.length > 0 && (
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
            Immunity-complementary partners
          </h2>
          <div className="space-y-2">
            {myPairs.map((p, i) => {
              const other = p.a_slug === c.slug
                ? { slug: p.b_slug, title: p.b_title, immunities: p.b_immunities, class: p.b_class }
                : { slug: p.a_slug, title: p.a_title, immunities: p.a_immunities, class: p.a_class };
              const ck = CLASS_KEY[other.class];
              return (
                <Link key={i} href={`/champion/${other.slug}/`}
                  className={`class-${ck} class-card flex items-center gap-3 p-3 hover:translate-x-0.5`}>
                  <div className="text-sm font-semibold flex-1">+ {other.title}</div>
                  <div className="text-xs text-chrome-soft">covers {p.union.join(", ")}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {c.mechanics && (
        <section>
          <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">Mechanics</h2>
          <p className="text-chrome leading-relaxed text-sm max-w-3xl">{c.mechanics}</p>
        </section>
      )}
    </div>
  );
}

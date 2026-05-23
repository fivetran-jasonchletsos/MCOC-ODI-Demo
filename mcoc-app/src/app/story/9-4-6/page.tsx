"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { champions, championBySlug } from "@/lib/data";
import { loadRoster } from "@/lib/roster";
import { asset } from "@/lib/asset";
import type { ChampionClass, RosterEntry } from "@/lib/types";

type Variant = "skill" | "cosmic";

const BOSS = {
  skill: {
    name: "Carina (Skill)",
    class: "Skill" as ChampionClass,
    counterClasses: ["Mystic"] as ChampionClass[],
    weakClasses: ["Science"] as ChampionClass[],
    advice:
      "Mystic champions take 35% reduced damage from Skill and deal 10% more — your highest leverage class. Skill bosses lean on bleed / armor break / fury — bring nullify, purify, and bleed immunity.",
    wantAbilities: ["nullify", "purify", "bleed immunity", "armor up", "evade", "incinerate", "power lock"],
    avoid: ["champions that rely on bleed (skill is bleed immune for boss)", "pure power gain DPS without nullify"],
  },
  cosmic: {
    name: "Carina (Cosmic)",
    class: "Cosmic" as ChampionClass,
    counterClasses: ["Mutant", "Skill"] as ChampionClass[],
    weakClasses: ["Tech"] as ChampionClass[],
    advice:
      "Cosmic bosses run massive power gain + buff stacking. Bring buff-removal (nullify, stagger) and prowess/precision-based damage. Mutant > Cosmic in class advantage.",
    wantAbilities: ["nullify", "stagger", "power burn", "power lock", "fate seal", "prowess", "incinerate"],
    avoid: ["champions whose damage depends on opponent buffs (their reaction tools will stack against you)"],
  },
};

const FIGHT_NOTES = [
  "Active boss in Act 9.4 — chapter completion required for the Elder title and Act 9 rewards.",
  "Two parallel boss fights: Skill Carina at the end of one path, Cosmic Carina at the end of the other. You need both paths cleared.",
  "Community has reported undocumented regen events — bring sustained DoT (incinerate / shock / coldsnap) to keep her HP pressed.",
  "Power management is the dominant axis: power lock, power burn, and fate seal all reduce variance.",
  "Long fight — energy-resistance is helpful but not required; ability accuracy reduction matters more than raw mitigation.",
];

function variantCounters(roster: RosterEntry[], v: Variant) {
  const def = BOSS[v];
  const candidates = roster
    .map((r) => ({ entry: r, champ: championBySlug[r.slug] }))
    .filter((row) => row.champ);

  const scored = candidates.map(({ entry, champ }) => {
    let score = 0;
    const reasons: string[] = [];
    if (champ.class && def.counterClasses.includes(champ.class)) {
      score += 5;
      reasons.push(`${champ.class} > ${def.class}`);
    }
    if (champ.class === def.class) {
      score -= 2;
      reasons.push(`same class disadvantage`);
    }
    if (champ.class && def.weakClasses.includes(champ.class)) {
      score -= 2;
      reasons.push(`${def.class} > ${champ.class}`);
    }
    const allText = [...champ.abilities, ...champ.immunities].join(" ").toLowerCase();
    for (const want of def.wantAbilities) {
      if (allText.includes(want)) {
        score += 2;
        reasons.push(`brings ${want}`);
      }
    }
    // Rank bonus — 7r3+ awakened sig200 is meaningfully stronger
    if (entry.stars === 7 && (entry.rank ?? 0) >= 3) score += 3;
    else if (entry.stars === 7 && (entry.rank ?? 0) >= 2) score += 2;
    else if (entry.stars === 7) score += 1;
    else if (entry.stars === 6 && entry.ascended) score += 1;
    if (entry.awakened && entry.sig && entry.sig >= 100) score += 1;

    return { entry, champ, score, reasons };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function badge(entry: RosterEntry) {
  const bits: string[] = [];
  if (entry.stars) bits.push(`${entry.stars}*`);
  if (entry.rank) bits.push(`R${entry.rank}`);
  if (entry.sig) bits.push(`sig${entry.sig}`);
  if (entry.ascended) bits.push("ASC");
  return bits.join(" ");
}

export default function Story946Page() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [variant, setVariant] = useState<Variant>("skill");

  useEffect(() => {
    setRoster(loadRoster());
  }, []);

  const skillCounters = useMemo(() => variantCounters(roster, "skill"), [roster]);
  const cosmicCounters = useMemo(() => variantCounters(roster, "cosmic"), [roster]);
  const visible = variant === "skill" ? skillCounters : cosmicCounters;
  const def = BOSS[variant];

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs text-chrome-dim uppercase tracking-wide mb-1">Act 9.4 — The Reckoning</div>
        <h1 className="font-display text-3xl font-bold">9.4.6 — Carina, Final Boss</h1>
        <p className="text-chrome-soft text-sm mt-2 max-w-3xl">
          The Act 9.4 final boss fight is split across two parallel paths — a <span className="text-skill font-semibold">Skill</span>{" "}
          version and a <span className="text-cosmic font-semibold">Cosmic</span> version of Carina. You must clear both to
          finish the chapter. Picks below are pulled from your roster and ranked by class advantage, ability fit, and rank.
        </p>
      </header>

      {roster.length === 0 && (
        <div className="bg-skill/10 border border-skill/40 rounded p-4 text-sm">
          You haven&apos;t loaded a roster yet. Open{" "}
          <Link href="/roster/" className="underline text-cosmic font-semibold">My Roster</Link>{" "}
          and click <span className="font-mono">Load Jason&apos;s roster</span> first — the picks here key off your owned champions.
        </div>
      )}

      <section className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setVariant("skill")}
          className={`text-left rounded-lg border p-4 transition ${
            variant === "skill"
              ? "border-skill bg-skill/10"
              : "border-ink-mid hover:border-chrome-soft"
          }`}
        >
          <div className="text-xs text-chrome-dim uppercase">Path 1</div>
          <div className="font-display text-xl font-bold text-skill">Carina (Skill)</div>
          <div className="text-xs text-chrome-soft mt-1">Counter class: Mystic. Weak to: Science.</div>
        </button>
        <button
          onClick={() => setVariant("cosmic")}
          className={`text-left rounded-lg border p-4 transition ${
            variant === "cosmic"
              ? "border-cosmic bg-cosmic/10"
              : "border-ink-mid hover:border-chrome-soft"
          }`}
        >
          <div className="text-xs text-chrome-dim uppercase">Path 2</div>
          <div className="font-display text-xl font-bold text-cosmic">Carina (Cosmic)</div>
          <div className="text-xs text-chrome-soft mt-1">Counter class: Mutant, Skill. Weak to: Tech.</div>
        </button>
      </section>

      <section className={`class-${def.class.toLowerCase()} class-card p-5`}>
        <h2 className="font-display text-lg uppercase tracking-wide mb-2" style={{ color: "var(--c-glow)" }}>
          How to fight {def.name}
        </h2>
        <p className="text-sm text-chrome">{def.advice}</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div>
            <div className="uppercase text-chrome-dim mb-1">Bring abilities</div>
            <ul className="space-y-0.5">
              {def.wantAbilities.map((a) => <li key={a}>· {a}</li>)}
            </ul>
          </div>
          <div>
            <div className="uppercase text-chrome-dim mb-1">Avoid</div>
            <ul className="space-y-0.5">
              {def.avoid.map((a) => <li key={a}>· {a}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
          Your top counters for {def.name}
        </h2>
        {visible.length === 0 ? (
          <div className="text-chrome-dim italic text-sm">
            No matching counters in your current roster. Load Jason&apos;s roster on the{" "}
            <Link href="/roster/" className="underline">My Roster</Link> page.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {visible.map(({ entry, champ, score, reasons }) => {
              const ck = champ.class ? champ.class.toLowerCase() : "";
              return (
                <Link
                  key={champ.slug}
                  href={`/champion/${champ.slug}/`}
                  className={`class-${ck} class-card p-3 hover:opacity-90 transition`}
                >
                  <div className="flex items-center gap-3">
                    {champ.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset(champ.portrait)}
                        alt={champ.title}
                        className="w-14 h-14 object-cover rounded border border-ink-mid"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-ink-mid rounded grid place-items-center text-xs">
                        {champ.title.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold truncate" style={{ color: "var(--c-glow)" }}>
                        {champ.title}
                      </div>
                      <div className="text-xs text-chrome-soft">
                        {champ.class} · {badge(entry)}
                      </div>
                      <div className="text-[10px] text-chrome-dim mt-0.5 line-clamp-2">
                        {reasons.join(" · ")}
                      </div>
                    </div>
                    <div className="text-2xl font-display font-bold" style={{ color: "var(--c-glow)" }}>
                      {score}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-ink-soft border border-ink-mid rounded-lg p-5">
        <h2 className="font-display text-lg uppercase tracking-wide text-chrome-soft mb-3">
          Fight notes
        </h2>
        <ul className="space-y-2 text-sm text-chrome">
          {FIGHT_NOTES.map((n, i) => (
            <li key={i} className="pl-3 border-l-2 border-chrome-dim">{n}</li>
          ))}
        </ul>
      </section>

      <section className="text-xs text-chrome-dim">
        Sourced from MCOC community guides and Kabam&apos;s Act 9.4 release notes. Scoring is computed locally
        from your roster — class wheel + ability fit + rank/sig multiplier.
      </section>
    </div>
  );
}

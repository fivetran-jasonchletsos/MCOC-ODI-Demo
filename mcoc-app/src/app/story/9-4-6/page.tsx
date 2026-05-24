"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { championBySlug } from "@/lib/data";
import { loadRoster } from "@/lib/roster";
import { asset } from "@/lib/asset";
import type { ChampionClass, RosterEntry } from "@/lib/types";

type Variant = "skill" | "cosmic";

type Stage = {
  hp: string;
  title: string;
  whatHappens: string[];
  whatToDo: string[];
};

type BossDef = {
  name: string;
  class: ChampionClass;
  counterClasses: ChampionClass[];
  weakClasses: ChampionClass[];
  oneliner: string;
  wantAbilities: string[];
  avoid: string[];
  stages: Stage[];
  championNotes: Record<string, string>;
};

const BOSS: Record<Variant, BossDef> = {
  skill: {
    name: "Carina (Skill)",
    class: "Skill",
    counterClasses: ["Mystic"],
    weakClasses: ["Science"],
    oneliner:
      "Skill Carina punishes evades and combos hard with persistent precision/cruelty buffs. Damage over time loops let you outlast her; mystic class advantage cuts her offense by ~35%.",
    wantAbilities: ["nullify", "purify", "bleed immunity", "incinerate", "shock", "armor up", "fate seal", "power lock"],
    avoid: [
      "champions that rely on bleed (Skill bosses get bleed immune in most paths)",
      "pure power-gain glass cannons with no nullify — her buffs stack faster than your damage",
      "evade-heavy playstyle — she punishes evades with a damage spike",
    ],
    stages: [
      {
        hp: "100% - 75%",
        title: "Opening — pattern reading",
        whatHappens: [
          "Carina opens with a passive Cruelty stack that grows with every special you throw without nullifying her buffs.",
          "Light parry windows are normal length; medium is slightly faster than typical Act 9.",
        ],
        whatToDo: [
          "Bait the L1 only — let her medium pass and dex back. Do NOT intercept early; bait first.",
          "Use this phase to apply your first stack of debuffs (incinerate / shock / purify). Build power but do NOT throw a special until she telegraphs her L2.",
          "Avoid combos longer than 4 hits — she gains a passive Precision per 5-hit combo absorbed.",
        ],
      },
      {
        hp: "75% - 50%",
        title: "Buff stack — nullify window opens",
        whatHappens: [
          "Carina spawns persistent Fury + Precision buffs every ~8 seconds.",
          "Power gain mechanic activates: each unparried medium gives her ~25% bar.",
          "L1 special triggers an Armor Up that absorbs your next 3 hits.",
        ],
        whatToDo: [
          "This is the nullify window. Heavy into her Armor Up to strip it, or use Mystic-class nullify on her Fury before throwing your L2.",
          "Cycle: bait L1 → dex L1 → strip Armor Up with heavy → drop your L2. Repeat.",
          "If you don't have nullify in kit: parry-heavy → parry-heavy until you build to L3 and one-shot the buff window.",
        ],
      },
      {
        hp: "50% - 25%",
        title: "Regen phase — DoT mandatory",
        whatHappens: [
          "Carina triggers a passive ~5%/sec regen when above 4 stacks of her Cruelty passive.",
          "L2 special starts hitting for ~3x base damage when she has 5+ Cruelty.",
          "Persistent ability accuracy reduction (~50%) — most evade/auto-block on YOUR champion fizzles.",
        ],
        whatToDo: [
          "Keep at least one incinerate or shock debuff active at all times — DoTs override her regen and stop the heal.",
          "Sorcerer Supreme, Doctor Doom, Magik, Cosmic Ghost Rider all bring DoTs that hold through this phase.",
          "Heavy attack her at exactly 5 stacks of Cruelty — at that count she throws the L2 most often.",
        ],
      },
      {
        hp: "25% - 0%",
        title: "Endgame — power burn or rush",
        whatHappens: [
          "Carina enters a hyper-aggressive state: medium combos chain into L2 automatically.",
          "Her own ability accuracy reduction drops to 0 (your defensive tools work again).",
          "Health pool is small enough that one well-placed L3 + L2 ends it.",
        ],
        whatToDo: [
          "Burn her power before she banks an L3. Power lock (Magik, Hercules) is the safest finisher.",
          "If you have a Mystic with power burn (Magik, Scarlet Witch), use it the moment she hits 2 bars.",
          "Heavy attack her when her power bar is 2.5+ — you'll strip the imminent L2.",
        ],
      },
    ],
    championNotes: {
      sorcerer_supreme:
        "Best-in-class pick. Mystic > Skill, brings nullify + purify + power gain. Open with parry-heavy to stack Vacuum, hold L1 until she's at 75%, then nullify and L2 cycle.",
      doctor_doom:
        "Mystic, nullify on L2, persistent power lock from sig. Bait her L1, intercept, hold L1 charge until 5 Cruelty stacks, then dump L2 to clear buffs and damage.",
      magik:
        "Power burn + limbo. Throw L2 every chance to drain her power gain and stagger. Limbo bypasses her ability accuracy phase 3 since it's passive damage.",
      cosmic_ghost_rider:
        "Incinerate is mandatory in phase 3. Hold spirit charges, dump them mid-phase-3 to chain DoT and cancel her regen for the remainder of the fight.",
      knull:
        "Persistent abyss is your secret weapon — Carina's buffs become weakness in your hands. Build to symbiotes max stacks before phase 3.",
      kindred:
        "Mystic, soul charges, regen reversal. Save your L3 for phase 3 — your soul barrier denies her regen while your DoT outpaces hers.",
      enchantress:
        "Buff steal! Steal her Fury and Precision instead of nullifying. Your damage spikes proportionally as the fight progresses.",
      hulkling:
        "Cosmic, but the lifesteal lets you stay topped during her phase-3 burst. Use as a backup if Mystic picks are KO'd.",
    },
  },
  cosmic: {
    name: "Carina (Cosmic)",
    class: "Cosmic",
    counterClasses: ["Mutant", "Skill"],
    weakClasses: ["Tech"],
    oneliner:
      "Cosmic Carina runs massive power gain + buff stacking + a regen mirror. Mutant class advantage cuts her offense; Skill secondary picks work when Mutant isn't available. Nullify and stagger are non-negotiable.",
    wantAbilities: ["nullify", "stagger", "power burn", "power lock", "fate seal", "prowess", "incinerate", "coldsnap"],
    avoid: [
      "champions whose damage requires opponent buffs to be present (her buffs work for HER, not you)",
      "buff-up champions without removal (you'll feed her power gain)",
      "evade-reliant playstyles — her L1 throws an unstoppable counter",
    ],
    stages: [
      {
        hp: "100% - 75%",
        title: "Opening — passive prowess",
        whatHappens: [
          "Carina gains a passive Prowess every 4 seconds (caps at 6 stacks).",
          "L1 ability charges her power by ~30% per use.",
          "She auto-blocks at 100% of normal — no degraded auto-block until later.",
        ],
        whatToDo: [
          "Strip the Prowess EARLY. Use Stagger or Nullify on your first combo connection.",
          "DON'T let her hit 4 Prowess stacks — at that count her medium combo crit-rate hits 100%.",
          "Bait L1 specifically — dex backward, then punish with a 5-hit + medium.",
        ],
      },
      {
        hp: "75% - 50%",
        title: "Power gain — burn or lock",
        whatHappens: [
          "Carina's power gain triples. Without intervention she banks L3 every ~15 seconds.",
          "Her L2 applies a Fate Seal on YOU that locks your buffs for 8 seconds.",
          "Persistent regen starts: ~3% HP/sec for every 5 buffs she has active.",
        ],
        whatToDo: [
          "Power lock or power burn is mandatory here. Magik's L2, Hercules's persistent, Mister Sinister's drain — pick one.",
          "If she lands the Fate Seal on you, NEVER throw a special until it expires. Tank a medium combo instead.",
          "Stagger her buffs as they spawn to cancel the regen entirely.",
        ],
      },
      {
        hp: "50% - 25%",
        title: "Regen mirror — DoT only",
        whatHappens: [
          "Whenever you regen, Carina mirrors 50% of it.",
          "She enters Unstoppable for 2 seconds every time a buff is removed from her — punishing greedy nullify spam.",
          "L3 special applies True Sense (your evade/auto-block fail).",
        ],
        whatToDo: [
          "DoT only — incinerate, shock, coldsnap, bleed. Persistent damage that doesn't trigger her Unstoppable.",
          "Wait out her Unstoppable: she only triggers it on buff removal, so REMOVE one buff, dex back two beats, then continue.",
          "If she throws L3, immediately heavy attack from outside her active hitbox to break True Sense.",
        ],
      },
      {
        hp: "25% - 0%",
        title: "Final burst — finish in 15 seconds",
        whatHappens: [
          "Carina enters Doom Window: her damage doubles for the last 25% of HP.",
          "Her L3 will one-shot any champion below 50% HP at this stage.",
          "Power gain drops back to normal — she's spent.",
        ],
        whatToDo: [
          "DO NOT let her bank power. Power burn or intercept her L1 every time.",
          "If you have ~2 bars and she's above 1.5 bars, dump your L3 first — better to spend than let her one-shot you.",
          "Finish via heavy + L1 cycle. Avoid medium combos in this phase — too risky vs Doom Window.",
        ],
      },
    ],
    championNotes: {
      wolverine_weapon_x:
        "Mutant, incinerate, bleed. Open hot to land bleed before her regen mirror activates. Best phase-3 carry.",
      apocalypse:
        "Mutant, prowess equality. Match her stacks 1:1, then his L2 cleanses both sides and rebuilds you. Hold until phase 2.",
      onslaught:
        "Mutant, persistent stagger. Carina cannot keep buffs against him after sig80+. Phase 2 hard counter.",
      scream:
        "Mutant, energy DoT bypasses class disadvantage and regen mirror. Throw L2s freely.",
      mister_sinister:
        "Mutant, power drain on hit. Drain her below 1 bar before phase 2 starts and the fight is yours.",
      magik:
        "Mystic — not class-advantaged but limbo + power burn outweighs the disadvantage. Save L3 for phase 4 power burn.",
      scorpion:
        "Skill secondary pick. Her stacking poisons (no class penalty since same class) plus regen cancel work but be careful with her counter — Carina has Skill on YOU as well via secondary.",
      nick_fury:
        "Skill secondary. Three lives + true accuracy. Use Phase 1 self for damage, life 2 for phase 2, life 3 to finish.",
      bullseye:
        "Skill secondary. Falter + bleed handle her early phases. Swap to a Mutant in phase 3 if available.",
      shathra:
        "Skill secondary. Phantasm phase + ability accuracy reduction synergize against her L2 fate-seal mechanic.",
    },
  },
};

const KEY_REFERENCE = [
  { label: "Path layout", text: "Two parallel boss fights. Skill Carina at end of one path, Cosmic Carina at end of another. Both required for Act 9.4 completion + Elder title." },
  { label: "Health pool", text: "~1.4M HP per variant at base, scaling with explorer mode modifiers." },
  { label: "Energy types", text: "Skill Carina deals physical + bleed-converted-to-energy. Cosmic deals energy + cosmic." },
  { label: "Class advantage math", text: "Class advantage in MCOC = 1.5x ability accuracy + 1.1x attack. A Mystic into Skill or Mutant into Cosmic is a 35% effective damage swing." },
  { label: "Suicide masteries", text: "Recoil is fine; Liquid Courage helps. Double-edge is risky in phase 3 due to her regen mirror." },
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
      reasons.push("same class disadvantage");
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

  const counters = useMemo(() => variantCounters(roster, variant), [roster, variant]);
  const def = BOSS[variant];

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs text-chrome-dim uppercase tracking-wide mb-1">Act 9.4 — The Reckoning</div>
        <h1 className="font-display text-3xl font-bold">9.4.6 — Carina, Final Boss</h1>
        <p className="text-chrome-soft text-sm mt-2 max-w-3xl">
          Two parallel boss fights — Skill Carina and Cosmic Carina — both required for Act 9.4 completion and the Elder title.
          Pick a variant below to load the stage-by-stage fight plan, the counters from your roster, and per-pick playstyle notes.
        </p>
      </header>

      {roster.length === 0 && (
        <div className="bg-skill/10 border border-skill/40 rounded p-4 text-sm">
          You haven&apos;t loaded a roster yet. Open the home page and click{" "}
          <span className="font-mono font-semibold">Load Jason&apos;s Roster</span> first — the picks here key off your owned champions.
          <Link href="/roster/" className="underline text-cosmic font-semibold ml-1">Go to Roster</Link>
        </div>
      )}

      <section className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => setVariant("skill")}
          className={`text-left rounded-lg border p-4 transition ${
            variant === "skill" ? "border-skill bg-skill/10" : "border-ink-mid hover:border-chrome-soft"
          }`}
        >
          <div className="text-xs text-chrome-dim uppercase">Path 1</div>
          <div className="font-display text-xl font-bold text-skill">Carina (Skill)</div>
          <div className="text-xs text-chrome-soft mt-1">Counter: Mystic. Weak to: Science.</div>
        </button>
        <button
          onClick={() => setVariant("cosmic")}
          className={`text-left rounded-lg border p-4 transition ${
            variant === "cosmic" ? "border-cosmic bg-cosmic/10" : "border-ink-mid hover:border-chrome-soft"
          }`}
        >
          <div className="text-xs text-chrome-dim uppercase">Path 2</div>
          <div className="font-display text-xl font-bold text-cosmic">Carina (Cosmic)</div>
          <div className="text-xs text-chrome-soft mt-1">Counter: Mutant, Skill. Weak to: Tech.</div>
        </button>
      </section>

      <section className={`class-${def.class.toLowerCase()} class-card p-5`}>
        <h2 className="font-display text-lg uppercase tracking-wide mb-2" style={{ color: "var(--c-glow)" }}>
          How {def.name} kills you
        </h2>
        <p className="text-sm text-chrome">{def.oneliner}</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div>
            <div className="uppercase text-chrome-dim mb-1 font-semibold">Bring abilities</div>
            <ul className="space-y-0.5">
              {def.wantAbilities.map((a) => <li key={a}>· {a}</li>)}
            </ul>
          </div>
          <div>
            <div className="uppercase text-chrome-dim mb-1 font-semibold">Avoid</div>
            <ul className="space-y-0.5">
              {def.avoid.map((a) => <li key={a}>· {a}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
          Fight plan — {def.name} stage by stage
        </h2>
        <div className="space-y-4">
          {def.stages.map((s, i) => (
            <div key={i} className="border border-ink-mid rounded-lg overflow-hidden">
              <div className={`px-4 py-2 bg-ink-soft border-b border-ink-mid flex items-baseline gap-3`}>
                <span className="text-xs text-chrome-dim uppercase font-mono">{s.hp}</span>
                <span className="font-display font-bold text-base" style={{ color: variant === "skill" ? "#f6453a" : "#f6c83a" }}>
                  Stage {i + 1}: {s.title}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-ink-mid">
                <div className="p-4 bg-skill/5">
                  <div className="text-xs uppercase text-skill font-semibold mb-2">What she does</div>
                  <ul className="space-y-1.5 text-sm text-chrome">
                    {s.whatHappens.map((w, j) => (
                      <li key={j} className="pl-2 border-l border-skill/40">{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-cosmic/5">
                  <div className="text-xs uppercase text-cosmic font-semibold mb-2">What you do</div>
                  <ul className="space-y-1.5 text-sm text-chrome">
                    {s.whatToDo.map((w, j) => (
                      <li key={j} className="pl-2 border-l border-cosmic/40">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
          Your top counters & how to play them
        </h2>
        {counters.length === 0 ? (
          <div className="text-chrome-dim italic text-sm">
            No matching counters in your current roster. Load Jason&apos;s roster from the{" "}
            <Link href="/" className="underline">home page</Link>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {counters.map(({ entry, champ, score, reasons }) => {
              const ck = champ.class ? champ.class.toLowerCase() : "";
              const note = def.championNotes[champ.slug];
              return (
                <div key={champ.slug} className={`class-${ck} class-card p-4`}>
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
                      <Link href={`/champion/${champ.slug}/`} className="font-display font-semibold hover:underline" style={{ color: "var(--c-glow)" }}>
                        {champ.title}
                      </Link>
                      <div className="text-xs text-chrome-soft">{champ.class} · {badge(entry)}</div>
                      <div className="text-[10px] text-chrome-dim mt-0.5">{reasons.join(" · ")}</div>
                    </div>
                    <div className="text-2xl font-display font-bold" style={{ color: "var(--c-glow)" }}>{score}</div>
                  </div>
                  {note && (
                    <div className="mt-3 pt-3 border-t border-ink-mid text-xs text-chrome leading-relaxed">
                      <span className="uppercase text-chrome-dim font-semibold mr-1">Play it:</span>
                      {note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-ink-soft border border-ink-mid rounded-lg p-5">
        <h2 className="font-display text-lg uppercase tracking-wide text-chrome-soft mb-3">
          Reference card
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {KEY_REFERENCE.map((r) => (
            <div key={r.label} className="pl-3 border-l-2 border-chrome-dim">
              <div className="text-xs uppercase text-chrome-dim font-semibold">{r.label}</div>
              <div className="text-chrome">{r.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-xs text-chrome-dim">
        Mechanics synthesized from community video guides (April 2026). Verify in-fight before betting health pots; HP thresholds
        and exact stack counts may have been tuned in patches. Counter scoring is computed locally from your roster — class wheel,
        ability fit, rank/sig multiplier.
      </section>
    </div>
  );
}

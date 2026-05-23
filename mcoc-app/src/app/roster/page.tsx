"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  champions,
  championBySlug,
  championCounters,
  supercounters,
} from "@/lib/data";
import {
  loadRoster,
  saveRoster,
  clearRoster,
  parseRosterText,
  rosterToText,
} from "@/lib/roster";
import { CLASS_KEY, CLASS_LIST } from "@/lib/types";
import { asset } from "@/lib/asset";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { RosterCellEditor } from "@/components/RosterCellEditor";
import type { ChampionClass, RosterEntry } from "@/lib/types";

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [paste, setPaste] = useState("");
  const [failed, setFailed] = useState<string[]>([]);
  const [filterCls, setFilterCls] = useState<ChampionClass | "all">("all");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setRoster(loadRoster());
  }, []);

  function applyPaste() {
    const { ok, failed } = parseRosterText(paste);
    const seen = new Set(roster.map((r) => r.slug));
    const merged = [...roster];
    for (const e of ok) {
      if (!seen.has(e.slug)) {
        merged.push(e);
        seen.add(e.slug);
      } else {
        const idx = merged.findIndex((m) => m.slug === e.slug);
        merged[idx] = { ...merged[idx], ...e };
      }
    }
    setRoster(merged);
    saveRoster(merged);
    setFailed(failed);
    setPaste("");
  }

  function toggleOwn(slug: string) {
    const idx = roster.findIndex((r) => r.slug === slug);
    let next;
    if (idx === -1) {
      next = [...roster, { slug, stars: null, rank: null, sig: null, awakened: false, ascended: false }];
      setEditing(slug); // open editor immediately for new entries
    } else {
      next = roster.filter((r) => r.slug !== slug);
    }
    setRoster(next);
    saveRoster(next);
  }

  function openEditor(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    // Add to roster if not yet owned, then open
    if (!roster.find((r) => r.slug === slug)) {
      const next = [...roster, { slug, stars: null, rank: null, sig: null, awakened: false, ascended: false }];
      setRoster(next);
      saveRoster(next);
    }
    setEditing(slug);
  }

  function saveEntry(entry: RosterEntry) {
    const idx = roster.findIndex((r) => r.slug === entry.slug);
    const next = idx === -1 ? [...roster, entry] : roster.map((r) => (r.slug === entry.slug ? entry : r));
    setRoster(next);
    saveRoster(next);
  }

  function exportRoster() {
    const text = rosterToText(roster);
    navigator.clipboard.writeText(text).catch(() => {});
    alert(`Copied ${roster.length} champions to clipboard.`);
  }

  function addEntries(entries: RosterEntry[]) {
    const seen = new Set(roster.map((r) => r.slug));
    const merged = [...roster];
    for (const e of entries) {
      if (!seen.has(e.slug)) {
        merged.push(e);
        seen.add(e.slug);
      }
    }
    setRoster(merged);
    saveRoster(merged);
  }

  async function loadJasonRoster() {
    const res = await fetch(asset("/data/jason_roster.json") || "/data/jason_roster.json");
    const entries = (await res.json()) as RosterEntry[];
    setRoster(entries);
    saveRoster(entries);
  }

  // Insight: ability supercounters scoped to roster
  const rosterSlugs = useMemo(() => new Set(roster.map((r) => r.slug)), [roster]);
  const myAbilities = useMemo(() => {
    const set = new Set<string>();
    for (const r of roster) {
      const c = championBySlug[r.slug];
      if (c) c.abilities.forEach((a) => set.add(a));
    }
    return set;
  }, [roster]);
  const myImmunities = useMemo(() => {
    const set = new Set<string>();
    for (const r of roster) {
      const c = championBySlug[r.slug];
      if (c) c.immunities.forEach((i) => set.add(i));
    }
    return set;
  }, [roster]);

  // Counter-coverage gaps: top defenders no roster champ scores >0 against
  const coverageGaps = useMemo(() => {
    if (roster.length === 0) return [];
    const gaps: { defender: string; reason: string }[] = [];
    for (const [defSlug, list] of Object.entries(championCounters)) {
      if (rosterSlugs.has(defSlug)) continue;
      const myCounter = list.find((co) => rosterSlugs.has(co.slug));
      if (!myCounter) {
        const d = championBySlug[defSlug];
        if (d) {
          gaps.push({
            defender: d.title,
            reason: `No roster champion counters ${d.title}'s ${d.abilities.slice(0, 3).join(", ")}.`,
          });
        }
      }
    }
    return gaps.slice(0, 25);
  }, [rosterSlugs]);

  const mySupercounters = supercounters.filter((s) =>
    s.offerers.some((o) => rosterSlugs.has(o))
  );

  const ownedSet = new Set(roster.map((r) => r.slug));
  const grid = champions.filter((c) => filterCls === "all" || c.class === filterCls);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold mb-2">My Roster</h1>
        <p className="text-chrome-soft text-sm max-w-2xl">
          Paste a list, click portraits below, or both. Saves to your browser only. Your insights below
          update live as you add champions.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-ink-soft border border-ink-mid rounded-lg p-4">
          <h2 className="font-display text-sm uppercase tracking-wide text-chrome-soft mb-2">
            Paste roster
          </h2>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={`Doctor Doom 7* R3 sig200\nHercules 6* R5 ascended\nAegon 6* R4 sig200\n...`}
            rows={8}
            className="w-full bg-ink border border-ink-mid rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-chrome-soft"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button onClick={applyPaste} className="px-3 py-1.5 bg-cosmic text-ink rounded font-semibold text-sm">
              Add to roster
            </button>
            <button onClick={loadJasonRoster} className="px-3 py-1.5 bg-mystic text-ink rounded font-semibold text-sm">
              Load Jason&apos;s roster (218)
            </button>
            <button onClick={exportRoster} className="px-3 py-1.5 border border-chrome-soft text-chrome rounded text-sm">
              Export
            </button>
            <button onClick={() => { clearRoster(); setRoster([]); }} className="px-3 py-1.5 border border-skill text-skill rounded text-sm">
              Clear all
            </button>
          </div>
          {failed.length > 0 && (
            <div className="mt-3 text-xs text-skill">
              <div className="font-semibold mb-1">Couldn't match:</div>
              <ul className="space-y-0.5 font-mono">
                {failed.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}
        </div>
        <ScreenshotUpload onAdd={addEntries} />
        <div className="bg-ink-soft border border-ink-mid rounded-lg p-4">
          <h2 className="font-display text-sm uppercase tracking-wide text-chrome-soft mb-2">
            Roster snapshot
          </h2>
          <div className="text-3xl font-display font-bold">{roster.length}</div>
          <div className="text-xs text-chrome-soft mb-3">champions owned</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {CLASS_LIST.map((k) => {
              const n = roster.filter((r) => championBySlug[r.slug]?.class === k).length;
              return (
                <div key={k} className={`class-${k.toLowerCase()} class-card p-2 text-center`}>
                  <div className="font-bold text-lg" style={{ color: "var(--c-glow)" }}>{n}</div>
                  <div className="text-chrome-soft uppercase text-[10px]">{k}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
          Tap to add / remove
        </h2>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setFilterCls("all")}
            className={`px-3 py-1.5 rounded-md text-xs border ${filterCls === "all" ? "bg-chrome text-ink border-chrome" : "border-ink-mid text-chrome-soft"}`}
          >
            All
          </button>
          {CLASS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setFilterCls(k)}
              className={`class-${k.toLowerCase()} px-3 py-1.5 rounded-md text-xs font-medium border`}
              style={
                filterCls === k
                  ? { background: "var(--c)", color: "#0a0a12", borderColor: "var(--c)" }
                  : { borderColor: "var(--c)", color: "var(--c-glow)", opacity: 0.7 }
              }
            >
              {k}
            </button>
          ))}
        </div>
        <p className="text-xs text-chrome-dim mb-2">
          Click a portrait to mark as owned (opens stars/rank editor). Right-click or long-press an owned champ to remove. Click the badge on an owned champ to edit stats.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5">
          {grid.map((c) => {
            const owned = ownedSet.has(c.slug);
            const entry = roster.find((r) => r.slug === c.slug);
            const ck = c.class ? CLASS_KEY[c.class] : "";
            return (
              <div key={c.slug} className="relative">
                <button
                  onClick={() => toggleOwn(c.slug)}
                  onContextMenu={(e) => { e.preventDefault(); if (owned) toggleOwn(c.slug); }}
                  className={`class-${ck} class-card aspect-square overflow-hidden relative w-full ${owned ? "" : "opacity-30 hover:opacity-90"}`}
                  title={c.title}
                >
                  {c.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset(c.portrait)} alt={c.title} loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-[10px] text-chrome-dim">
                      {c.title.slice(0, 2)}
                    </div>
                  )}
                  {owned && entry && (
                    <div
                      onClick={(e) => openEditor(e, c.slug)}
                      className="absolute inset-x-0 bottom-0 bg-cosmic/95 text-ink text-[10px] text-center font-bold py-0.5 cursor-pointer hover:bg-cosmic"
                    >
                      {entry.stars ? `${entry.stars}*` : ""}{entry.rank ? ` R${entry.rank}` : ""}{!entry.stars && !entry.rank ? "OWNED" : ""}
                      {entry.ascended ? " ASC" : ""}
                    </div>
                  )}
                </button>
                {editing === c.slug && entry && (
                  <RosterCellEditor
                    initial={entry}
                    onSave={saveEntry}
                    onClose={() => setEditing(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {roster.length > 0 && (
        <>
          <section>
            <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
              Your ability supercounters
            </h2>
            <p className="text-chrome-soft text-sm mb-3 max-w-2xl">
              Abilities your roster brings, ranked by how many top defenders they counter.
              {" "}This is your highest-leverage offensive tool kit.
            </p>
            <div className="space-y-2">
              {mySupercounters.slice(0, 10).map((s) => {
                const mine = s.offerers.filter((o) => rosterSlugs.has(o));
                return (
                  <div key={s.ability} className="bg-ink-soft border border-ink-mid rounded p-3">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-display text-lg font-semibold text-cosmic">{s.ability}</span>
                      <span className="text-xs text-chrome-soft">
                        counters {s.countered_count} top defenders
                      </span>
                    </div>
                    <div className="text-xs text-chrome-soft mt-1">
                      Your bringers: {mine.map((m) => championBySlug[m]?.title).filter(Boolean).join(", ")}
                    </div>
                  </div>
                );
              })}
              {mySupercounters.length === 0 && (
                <div className="text-chrome-dim italic text-sm">
                  No supercounter abilities from your roster yet — add more champions.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl uppercase tracking-wide text-chrome-soft mb-3">
              Counter-coverage gaps
            </h2>
            <p className="text-chrome-soft text-sm mb-3 max-w-2xl">
              Defenders no champion in your roster scores any positive counter signal against. Your blind spots.
            </p>
            {coverageGaps.length === 0 ? (
              <div className="text-chrome-soft text-sm italic">
                Add more champions to compute coverage gaps.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {coverageGaps.map((g, i) => (
                  <div key={i} className="bg-ink-soft border border-skill/40 rounded p-3">
                    <div className="font-display font-semibold text-skill">{g.defender}</div>
                    <div className="text-xs text-chrome-soft mt-1">{g.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

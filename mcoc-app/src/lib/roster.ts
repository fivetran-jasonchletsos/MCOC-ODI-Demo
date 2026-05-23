"use client";

import { fuzzyFindChampion } from "./data";
import type { RosterEntry } from "./types";

const KEY = "mcoc-roster-v1";

export function loadRoster(): RosterEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRoster(roster: RosterEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(roster));
}

export function clearRoster() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/**
 * Loose paste-text parser. Each non-empty line becomes one roster entry.
 * Recognized tokens (any order):
 *   - 7*, 6*, 5*, or 7 → stars
 *   - R5, r4, rank3 → rank
 *   - sig200, s80, sig=120 → signature level
 *   - awakened, dupe → awakened=true
 *   - ascended, asc → ascended=true
 * Everything else is treated as part of the champion name.
 */
export function parseRosterText(text: string): { ok: RosterEntry[]; failed: string[] } {
  const ok: RosterEntry[] = [];
  const failed: string[] = [];
  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#") || line.startsWith("//")) continue;

    let stars: number | null = null;
    let rank: number | null = null;
    let sig: number | null = null;
    let awakened = false;
    let ascended = false;

    const tokens = line.split(/[\s,]+/);
    const nameParts: string[] = [];
    for (const t of tokens) {
      const tl = t.toLowerCase();
      let m;
      if ((m = tl.match(/^([1-9])\*$/))) { stars = Number(m[1]); continue; }
      if ((m = tl.match(/^r(?:ank)?[=:]?([1-9])$/))) { rank = Number(m[1]); continue; }
      if ((m = tl.match(/^r([1-9])$/))) { rank = Number(m[1]); continue; }
      if ((m = tl.match(/^([67])r([1-9])$/))) { stars = Number(m[1]); rank = Number(m[2]); continue; }
      if ((m = tl.match(/^s(?:ig)?[=:]?(\d+)$/))) { sig = Number(m[1]); continue; }
      if (tl === "awakened" || tl === "dupe" || tl === "duped" || tl === "a") { awakened = true; continue; }
      if (tl === "ascended" || tl === "asc") { ascended = true; continue; }
      nameParts.push(t);
    }
    const name = nameParts.join(" ").trim();
    if (!name) continue;
    const champ = fuzzyFindChampion(name);
    if (!champ) {
      failed.push(line);
      continue;
    }
    if (sig && sig > 0) awakened = true;
    ok.push({ slug: champ.slug, stars, rank, sig, awakened, ascended });
  }
  return { ok, failed };
}

export function rosterToText(roster: RosterEntry[]): string {
  return roster
    .map((r) => {
      const parts = [r.slug.replace(/_/g, " ")];
      if (r.stars) parts.push(`${r.stars}*`);
      if (r.rank) parts.push(`R${r.rank}`);
      if (r.sig) parts.push(`sig${r.sig}`);
      if (r.awakened && !r.sig) parts.push("awakened");
      if (r.ascended) parts.push("ascended");
      return parts.join(" ");
    })
    .join("\n");
}

import championsRaw from "../../public/data/champions.json";
import abilitiesRaw from "../../public/data/abilities.json";
import supercountersRaw from "../../public/data/insights/supercounters.json";
import countersRaw from "../../public/data/insights/champion_counters.json";
import immunityPairsRaw from "../../public/data/insights/immunity_pairs.json";
import debuffChainsRaw from "../../public/data/insights/debuff_chains.json";
import classColorsRaw from "../../public/data/class_colors.json";
import type {
  Champion,
  Ability,
  SupercounterRow,
  CounterRow,
  ImmunityPair,
  DebuffChain,
  ChampionClass,
} from "./types";

export const champions = championsRaw as unknown as Champion[];
export const abilities = abilitiesRaw as unknown as Ability[];
export const supercounters = supercountersRaw as unknown as SupercounterRow[];
export const championCounters = countersRaw as unknown as Record<string, CounterRow[]>;
export const immunityPairs = immunityPairsRaw as unknown as ImmunityPair[];
export const debuffChains = debuffChainsRaw as unknown as DebuffChain[];
export const classColors = classColorsRaw as { class: ChampionClass; hex: string; deep: string; glow: string }[];

export const championBySlug: Record<string, Champion> = Object.fromEntries(
  champions.map((c) => [c.slug, c])
);
export const abilityByName: Record<string, Ability> = Object.fromEntries(
  abilities.map((a) => [a.name, a])
);

export function fuzzyFindChampion(name: string): Champion | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const c of champions) {
    const ck = c.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (ck === key) return c;
  }
  // Substring match
  for (const c of champions) {
    const ck = c.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (ck.includes(key) || key.includes(ck)) return c;
  }
  return null;
}

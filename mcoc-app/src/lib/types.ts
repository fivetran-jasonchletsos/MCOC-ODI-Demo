export type ChampionClass =
  | "Cosmic"
  | "Tech"
  | "Mutant"
  | "Skill"
  | "Science"
  | "Mystic";

export const CLASS_LIST: ChampionClass[] = [
  "Cosmic", "Tech", "Mutant", "Skill", "Science", "Mystic",
];

export const CLASS_KEY: Record<ChampionClass, string> = {
  Cosmic: "cosmic", Tech: "tech", Mutant: "mutant",
  Skill: "skill", Science: "science", Mystic: "mystic",
};

export type Tags = {
  offensive: string[];
  defensive: string[];
  size: string | null;
  other: string[];
};

export type Champion = {
  slug: string;
  title: string;
  class: ChampionClass | null;
  tags: Tags;
  abilities: string[];
  immunities: string[];
  signature_ability: string | null;
  release_date: string | null;
  portrait: string | null;
  tiers: Record<string, string>;
  mechanics: string;
};

export type Ability = {
  name: string;
  champions: string[];
  champion_count: number;
  archetypes: string[];
  counters: { archetype: string; strength: string; notes: string }[];
};

export type SupercounterRow = {
  ability: string;
  archetypes_countered: string[];
  countered_defenders: string[];
  countered_count: number;
  offerers: string[];
  offerer_count: number;
  leverage: number;
};

export type CounterRow = {
  slug: string;
  title: string;
  class: ChampionClass;
  score: number;
  ability_score: number;
  immunity_score: number;
  class_bonus: "advantage" | "disadvantage" | "neutral";
  matched_abilities: { ability: string; archetype: string; strength: string }[];
  matched_immunities: string[];
};

export type ImmunityPair = {
  a_slug: string; a_title: string; a_class: ChampionClass; a_immunities: string[];
  b_slug: string; b_title: string; b_class: ChampionClass; b_immunities: string[];
  union: string[];
  complementarity: number;
  union_size: number;
};

export type DebuffChain = {
  applier_ability: string;
  exploiter_ability: string;
  rationale: string;
  appliers: string[];
  exploiters: string[];
  team_pair_count: number;
};

export type RosterEntry = {
  slug: string;
  stars: number | null;
  rank: number | null;
  sig: number | null;
  awakened: boolean;
  ascended: boolean;
};

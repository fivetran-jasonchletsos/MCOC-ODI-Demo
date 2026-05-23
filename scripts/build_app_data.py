"""
Compute the app's data layer from raw scraper output + counter knowledge seeds.

Produces:
  mcoc-app/public/data/champions.json        — slim champion records
  mcoc-app/public/data/abilities.json        — ability catalog with archetypes
  mcoc-app/public/data/insights/supercounters.json
  mcoc-app/public/data/insights/champion_counters.json
  mcoc-app/public/data/insights/immunity_pairs.json
  mcoc-app/public/data/insights/debuff_chains.json
  mcoc-app/public/data/insights/class_wheel.json

This is the dbt-wizard live-build target. The same outputs can be reproduced by
dbt models in transform/models/ — see the README in transform/ for the SQL.
"""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
SEEDS = ROOT / "transform" / "seeds"
OUT = ROOT / "mcoc-app" / "public" / "data"
INS = OUT / "insights"


def load_csv(p: Path) -> list[dict]:
    with open(p) as f:
        return list(csv.DictReader(f))


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    INS.mkdir(parents=True, exist_ok=True)

    champions_raw = json.loads((RAW / "champions.json").read_text())
    ability_counters = load_csv(SEEDS / "ability_counters.csv")
    ability_archetypes = load_csv(SEEDS / "ability_archetypes.csv")
    class_wheel = load_csv(SEEDS / "class_wheel.csv")
    class_colors = load_csv(SEEDS / "class_colors.csv")

    # ---------- slim champion records ----------
    champs = []
    for c in champions_raw:
        if not c.get("title"):
            continue
        slug = c.get("slug") or slugify(c["title"])
        portrait_path = None
        if c.get("portrait_file"):
            ext = Path(c["portrait_file"]).suffix or ".png"
            portrait_path = f"/images/champions/{slug}{ext}"
        champs.append({
            "slug": slug,
            "title": c["title"],
            "class": c.get("class"),
            "tags": c.get("tags", {}),
            "abilities": c.get("abilities", []),
            "immunities": c.get("immunities", []),
            "signature_ability": c.get("signature_ability"),
            "release_date": c.get("release_date"),
            "portrait": portrait_path,
            "tiers": c.get("tiers", {}),
            "mechanics": c.get("mechanics", ""),
        })
    champs.sort(key=lambda x: x["title"])
    (OUT / "champions.json").write_text(json.dumps(champs, indent=2))
    print(f"  champions.json: {len(champs)} records")

    # ---------- ability catalog ----------
    # archetype lookups
    arch_by_ability: dict[str, list[str]] = defaultdict(list)
    for row in ability_archetypes:
        arch_by_ability[row["ability"]].append(row["archetype_tag"])

    counters_by_ability: dict[str, list[dict]] = defaultdict(list)
    for row in ability_counters:
        counters_by_ability[row["attacker_ability"]].append({
            "archetype": row["counters_archetype"],
            "strength": row["strength"],
            "notes": row.get("notes", ""),
        })

    # Catalog of every ability seen on any champion
    ability_to_champions: dict[str, list[str]] = defaultdict(list)
    for c in champs:
        for a in c["abilities"]:
            ability_to_champions[a].append(c["slug"])
    abilities_catalog = []
    for ab, slugs in sorted(ability_to_champions.items()):
        abilities_catalog.append({
            "name": ab,
            "champions": slugs,
            "champion_count": len(slugs),
            "archetypes": arch_by_ability.get(ab, []),
            "counters": counters_by_ability.get(ab, []),
        })
    (OUT / "abilities.json").write_text(json.dumps(abilities_catalog, indent=2))
    print(f"  abilities.json: {len(abilities_catalog)} unique abilities")

    # ---------- ability supercounters (roster-agnostic) ----------
    # Score each ability by how many top-tier defenders it counters.
    # "Top-tier defender" proxy: champion has at least one defensive tag
    # OR is one of the canonical big defenders (hard-coded list).
    TOP_DEFENDER_NAMES = {
        "Korg", "Mojo", "Maestro", "Maestro (Cosmic)", "Hood", "Doctor Voodoo",
        "Mister Sinister", "Magneto (House of X)", "Mister Negative", "Mordo",
        "Spider-Man (Stark Enhanced)", "Mysterio", "Onslaught", "Apocalypse",
        "Knull", "Serpent", "Galan", "Hercules", "Photon", "Cassie Lang",
        "Dust", "Diablo", "Magik", "Doctor Doom", "Doctor Strange",
        "Iron Patriot", "Sentinel", "Nimrod", "Bastion", "Omega Sentinel",
        "Kingpin", "Dragon Man", "Quake", "Misty Knight", "Toad",
    }

    def is_top_defender(c: dict) -> bool:
        if c["title"] in TOP_DEFENDER_NAMES:
            return True
        defensive = c.get("tags", {}).get("defensive") or []
        return bool(defensive)

    top_defenders = [c for c in champs if is_top_defender(c)]
    print(f"  top defender pool: {len(top_defenders)} champions")

    # Build defender_archetype index: which archetypes each defender has
    defender_archetypes: dict[str, set[str]] = {}
    for d in top_defenders:
        arch = set()
        for a in d["abilities"]:
            arch.update(arch_by_ability.get(a, []))
        defender_archetypes[d["slug"]] = arch

    # For each attacker ability, count defenders it counters
    supercounter_rows = []
    for ab, counter_defs in counters_by_ability.items():
        counter_archetypes = {cd["archetype"] for cd in counter_defs}
        countered_defenders = []
        for d_slug, d_archs in defender_archetypes.items():
            if d_archs & counter_archetypes:
                countered_defenders.append(d_slug)
        if not countered_defenders:
            continue
        # champions that have this ability
        offerers = ability_to_champions.get(ab, [])
        supercounter_rows.append({
            "ability": ab,
            "archetypes_countered": sorted(counter_archetypes),
            "countered_defenders": sorted(countered_defenders),
            "countered_count": len(countered_defenders),
            "offerers": offerers,
            "offerer_count": len(offerers),
            "leverage": len(countered_defenders) / max(len(offerers), 1),
        })
    supercounter_rows.sort(key=lambda r: -r["countered_count"])
    (INS / "supercounters.json").write_text(json.dumps(supercounter_rows, indent=2))
    print(f"  insights/supercounters.json: {len(supercounter_rows)} abilities")

    # ---------- per-champion counters ----------
    # For each defender, compute which champions counter them
    # via archetype matching + class wheel.
    wheel: dict[tuple[str, str], str] = {
        (r["attacker_class"], r["defender_class"]): r["bonus"]
        for r in class_wheel
    }

    counters_for_defender: dict[str, list[dict]] = {}
    for d in champs:
        d_arch = set()
        for a in d["abilities"]:
            d_arch.update(arch_by_ability.get(a, []))
        if not d_arch:
            continue
        scored = []
        for a in champs:
            if a["slug"] == d["slug"]:
                continue
            # Build attacker's archetype-counter set
            ability_score = 0
            matched_abilities = []
            for ab in a["abilities"]:
                for cd in counters_by_ability.get(ab, []):
                    if cd["archetype"] in d_arch:
                        s = 3 if cd["strength"] == "strong" else (2 if cd["strength"] == "medium" else 1)
                        ability_score += s
                        matched_abilities.append({"ability": ab, "archetype": cd["archetype"], "strength": cd["strength"]})
            # Immunity bonus: attacker immune to a debuff the defender applies
            immunity_score = 0
            matched_immunities = []
            for imm in a.get("immunities", []):
                if imm in d["abilities"]:
                    immunity_score += 3
                    matched_immunities.append(imm)
            # Class wheel
            class_bonus = wheel.get((a["class"], d["class"]), "neutral")
            class_score = 2 if class_bonus == "advantage" else (-1 if class_bonus == "disadvantage" else 0)
            total = ability_score + immunity_score + class_score
            if total > 0:
                scored.append({
                    "slug": a["slug"],
                    "title": a["title"],
                    "class": a["class"],
                    "score": total,
                    "ability_score": ability_score,
                    "immunity_score": immunity_score,
                    "class_bonus": class_bonus,
                    "matched_abilities": matched_abilities,
                    "matched_immunities": matched_immunities,
                })
        scored.sort(key=lambda r: -r["score"])
        counters_for_defender[d["slug"]] = scored[:10]

    (INS / "champion_counters.json").write_text(json.dumps(counters_for_defender, indent=2))
    print(f"  insights/champion_counters.json: {len(counters_for_defender)} defenders scored")

    # ---------- immunity complementarity pairs ----------
    # Pairs of champions whose immunity union strictly exceeds either alone.
    pairs = []
    immune_champs = [c for c in champs if c.get("immunities")]
    for a, b in combinations(immune_champs, 2):
        a_set = set(a["immunities"])
        b_set = set(b["immunities"])
        union = a_set | b_set
        unique = (a_set ^ b_set)  # symmetric difference — what only one covers
        if len(unique) >= 2 and len(union) >= 3:
            pairs.append({
                "a_slug": a["slug"], "a_title": a["title"], "a_class": a["class"], "a_immunities": sorted(a_set),
                "b_slug": b["slug"], "b_title": b["title"], "b_class": b["class"], "b_immunities": sorted(b_set),
                "union": sorted(union),
                "complementarity": len(unique),
                "union_size": len(union),
            })
    pairs.sort(key=lambda r: (-r["complementarity"], -r["union_size"]))
    pairs = pairs[:200]
    (INS / "immunity_pairs.json").write_text(json.dumps(pairs, indent=2))
    print(f"  insights/immunity_pairs.json: {len(pairs)} pairs")

    # ---------- debuff-stack chains ----------
    # Pairs/trios where one champion applies a debuff that another exploits.
    # Heuristic: champion A applies an ability that's listed as the "archetype_tag"
    # target of champion B's counter ability — i.e., A *creates* the vulnerability
    # condition that B exploits. Limit to canonical multipliers (Shock, Incinerate,
    # Bleed, Stagger setups).
    EXPLOIT_RULES = [
        # (applier_ability, exploiter_ability, why)
        ("Shock", "Heatsink", "Shock + Heatsink burns extra energy damage."),
        ("Incinerate", "Cold Snap", "Cold Snap on an incinerated target ramps DOT damage."),
        ("Bleed", "Bleed Vulnerability", "Vulnerability amplifies incoming bleed damage."),
        ("Bleed", "True Damage", "True Damage during bleed ignores enemy mitigations."),
        ("Stagger", "Nullify", "Stagger sets up Nullify on the next forced buff."),
        ("Stagger", "Petrify", "Petrify on a Staggered buff doubles effective denial."),
        ("Armor Break", "Incinerate", "Armor-broken target takes full DOT from Incinerate."),
        ("Armor Break", "Shock", "Armor-broken target eats full Shock DOT."),
        ("Concussion", "Nullify", "Reduced AAR means Nullify lands without failure."),
        ("Coldsnap", "Incinerate", "Switching from Coldsnap to Incinerate flips DOT scaling."),
    ]
    apply_index: dict[str, list[str]] = defaultdict(list)
    for c in champs:
        for a in c["abilities"]:
            apply_index[a].append(c["slug"])
    chains = []
    for app_ab, expl_ab, why in EXPLOIT_RULES:
        appliers = apply_index.get(app_ab, [])
        exploiters = apply_index.get(expl_ab, [])
        if not appliers or not exploiters:
            continue
        chains.append({
            "applier_ability": app_ab,
            "exploiter_ability": expl_ab,
            "rationale": why,
            "appliers": appliers,
            "exploiters": exploiters,
            "team_pair_count": len(appliers) * len(exploiters),
        })
    chains.sort(key=lambda r: -r["team_pair_count"])
    (INS / "debuff_chains.json").write_text(json.dumps(chains, indent=2))
    print(f"  insights/debuff_chains.json: {len(chains)} chain rules")

    # ---------- class wheel + colors as JSON for app ----------
    (INS / "class_wheel.json").write_text(json.dumps(class_wheel, indent=2))
    (OUT / "class_colors.json").write_text(json.dumps(class_colors, indent=2))

    print("\ndone.")


if __name__ == "__main__":
    main()

"""Force-fetch champions missing from the Champions/Simple master list.

Some champs (Yelena Belova, Karolina Dean, etc.) are real MCOC champions with
Fandom pages but absent from the canonical master list. This script fetches
their wikitext directly, parses them with the standard parser, and merges
them into data/raw/champions.json.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from scrape_wiki import fetch_wikitext, parse_champion, SLEEP

REPO = Path(__file__).resolve().parents[1]
RAW = REPO / "data" / "raw"
WT_DIR = RAW / "wikitext"

EXTRAS = [
    ("Yelena Belova", "Skill"),
    ("Karolina Dean", "Mutant"),
    ("High Evolutionary", "Science"),
    ("Blue Marvel", "Science"),
    ("Nico Minoru", "Mystic"),
    ("Dracula", "Mystic"),
    ("Lizard", "Science"),
    ("Franken-Castle", "Mystic"),
    ("Mr. Knight", "Mystic"),
    ("Solvarch", "Cosmic"),
    ("The Maker", "Science"),
    ("Silver Samurai", "Tech"),
    ("Imperiosa", "Cosmic"),
]


def safe_filename(s: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def main():
    WT_DIR.mkdir(parents=True, exist_ok=True)
    champs = json.loads((RAW / "champions.json").read_text())
    existing_titles = {c["title"].lower() for c in champs}

    added = 0
    for name, fallback_class in EXTRAS:
        if name.lower() in existing_titles:
            print(f"  skip (already present): {name}")
            continue
        cache = WT_DIR / f"{safe_filename(name)}.wiki"
        if cache.exists():
            wt = cache.read_text()
        else:
            print(f"  fetch: {name}")
            wt = fetch_wikitext(name)
            if wt:
                cache.write_text(wt)
            time.sleep(SLEEP)
        if not wt:
            print(f"  WARN missing wikitext: {name}")
            continue
        rec = parse_champion(name, wt)
        if not rec.get("class"):
            rec["class"] = fallback_class
        champs.append(rec)
        added += 1
        print(f"  added: {name} ({rec.get('class', '?')})")

    champs.sort(key=lambda c: c["title"].lower())
    (RAW / "champions.json").write_text(json.dumps(champs, indent=2))
    print(f"\nTotal champions: {len(champs)} (+{added})")


if __name__ == "__main__":
    main()

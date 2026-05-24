"""Expand the champion catalog beyond the Champions/Simple list.

Uses Fandom Category:Champion minus Category:Unplayable to find playable
champions absent from the existing catalog. Fetches each missing champion's
wikitext and merges into data/raw/champions.json.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from scrape_wiki import category_members, fetch_wikitext, parse_champion, SLEEP

REPO = Path(__file__).resolve().parents[1]
RAW = REPO / "data" / "raw"
WT_DIR = RAW / "wikitext"

# Manual skip list: archive pages, redirects, list pages
SKIP_NAMES = {
    "Carnage (Pre-Update)",
    "Venom (Pre-Update)",
    "List Of Champions By Type",
    "Champions/Simple",
    "Chair",
    "Doombot",  # generic enemy, not playable
}


def safe_filename(s: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def main():
    WT_DIR.mkdir(parents=True, exist_ok=True)
    champs = json.loads((RAW / "champions.json").read_text())
    existing_titles = {c["title"].lower() for c in champs}

    print("[1/3] fetching Fandom Category:Champion and Category:Unplayable...")
    champ = set(category_members("Champion"))
    unplayable = set(category_members("Unplayable"))
    playable = champ - unplayable
    print(f"  Category:Champion = {len(champ)}")
    print(f"  Category:Unplayable = {len(unplayable)}")
    print(f"  Inferred playable = {len(playable)}")

    candidates = sorted(
        n for n in playable
        if n.lower() not in existing_titles
        and n not in SKIP_NAMES
        and not n.startswith("Category:")
        and "/" not in n
    )
    print(f"  Candidates missing from catalog: {len(candidates)}")

    print(f"\n[2/3] fetching wikitext for {len(candidates)} candidates...")
    added = 0
    skipped = []
    for name in candidates:
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
            skipped.append(f"{name} (no wikitext)")
            continue
        rec = parse_champion(name, wt)
        # Only accept if it has a class — that's our playability signal
        if not rec.get("class"):
            skipped.append(f"{name} (no class — likely non-playable)")
            continue
        champs.append(rec)
        added += 1
        print(f"  added: {name} ({rec.get('class')})")

    champs.sort(key=lambda c: c["title"].lower())
    (RAW / "champions.json").write_text(json.dumps(champs, indent=2))
    print(f"\n[3/3] catalog: {len(champs)} (+{added})")
    if skipped:
        print(f"  skipped ({len(skipped)}):")
        for s in skipped:
            print(f"    {s}")


if __name__ == "__main__":
    main()

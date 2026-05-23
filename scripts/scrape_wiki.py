"""
MCOC Fandom wiki scraper using MediaWiki api.php.

HTML pages are Cloudflare-blocked; api.php is open. This pulls:
  - Master champion list from `List of Champions/Simple` (compact roster table).
  - Per-champion wikitext (class, tags, abilities, sig, tier availability, bio, mechanics).
  - Portrait images downloaded to data/raw/images/champions/.
  - Abilities/debuffs/detrimental effects category members.

Run: python3 scripts/scrape_wiki.py [--limit N] [--skip-images]
Outputs: data/raw/champions.json, data/raw/abilities.json, data/raw/debuffs.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

API = "https://marvel-contestofchampions.fandom.com/api.php"
UA = "MCOC-ODI-Demo/0.1 (personal demo; Jason Chletsos)"
SLEEP = 0.25  # seconds between calls — be polite

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
IMG_DIR = ROOT / "mcoc-app" / "public" / "images" / "champions"


def api_get(params: dict) -> dict:
    params = {**params, "format": "json"}
    qs = "&".join(f"{k}={quote(str(v), safe='|:_')}" for k, v in params.items())
    req = Request(f"{API}?{qs}", headers={"User-Agent": UA})
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_wikitext(title: str) -> str | None:
    try:
        d = api_get({"action": "parse", "page": title, "prop": "wikitext"})
        return d.get("parse", {}).get("wikitext", {}).get("*")
    except Exception as e:
        print(f"  ! wikitext fail {title}: {e}", file=sys.stderr)
        return None


def category_members(category: str, limit: int = 500) -> list[str]:
    out: list[str] = []
    cont: dict = {}
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmlimit": limit,
            **cont,
        }
        d = api_get(params)
        for m in d.get("query", {}).get("categorymembers", []):
            out.append(m["title"])
        if "continue" in d:
            cont = d["continue"]
            time.sleep(SLEEP)
        else:
            return out


def resolve_image_url(filename: str) -> str | None:
    try:
        d = api_get(
            {
                "action": "query",
                "titles": f"File:{filename}",
                "prop": "imageinfo",
                "iiprop": "url|size",
            }
        )
        pages = d.get("query", {}).get("pages", {})
        for _, p in pages.items():
            ii = p.get("imageinfo", [])
            if ii:
                return ii[0]["url"]
    except Exception as e:
        print(f"  ! image url fail {filename}: {e}", file=sys.stderr)
    return None


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    try:
        req = Request(url, headers={"User-Agent": UA})
        with urlopen(req, timeout=60) as r:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(r.read())
        return True
    except Exception as e:
        print(f"  ! download fail {url}: {e}", file=sys.stderr)
        return False


# Infobox field extraction — search globally; field names don't repeat outside the infobox.
CLASS_RE = re.compile(r"\|\s*class\s*=\s*\{\{Class\|([^}]+)\}\}")
TAGS_RE = re.compile(r"\|\s*tags\s*=\s*([^\n]+)")
ABILITIES_RE = re.compile(r"\|\s*abilities\s*=\s*([^\n]+)")
SIG_RE = re.compile(r"\|\s*signature ability\s*=\s*([^\n]+)")
RELEASE_RE = re.compile(r"\|\s*release date\s*=\s*([^\n<]+)")
TABBER_PORTRAIT_RE = re.compile(r"Portrait=\[\[File:([^|\]]+?\.(?:png|jpg|jpeg|webp))", re.IGNORECASE)
TABBER_FEATURED_RE = re.compile(r"Featured=\[\[File:([^|\]]+?\.(?:png|jpg|jpeg|webp))", re.IGNORECASE)
GALLERY_PORTRAIT_RE = re.compile(r"(?:^|>|\s)([^\n|<>]+?\.(?:png|jpg|jpeg|webp))\|Portrait\b", re.IGNORECASE | re.MULTILINE)
GALLERY_FEATURED_RE = re.compile(r"(?:^|>|\s)([^\n|<>]+?\.(?:png|jpg|jpeg|webp))\|Featured\b", re.IGNORECASE | re.MULTILINE)
BIO_RE = re.compile(r"==\s*Bio\s*==\s*(.*?)(?=\n==)", re.DOTALL)
MECHANICS_RE = re.compile(r"==\s*Mechanics\s*==\s*(.*?)(?=\n==)", re.DOTALL)
TIER_RE = re.compile(r"\|\s*tier(\d)\s*=\s*([^\n]+)")
IMMUNITIES_RE = re.compile(r"==\s*Immunities?\s*==\s*(.*?)(?=\n==)", re.DOTALL)


def find_portrait(wikitext: str) -> str | None:
    m = TABBER_PORTRAIT_RE.search(wikitext)
    if m:
        return m.group(1).strip()
    m = GALLERY_PORTRAIT_RE.search(wikitext)
    if m:
        return m.group(1).strip()
    return None


def find_featured(wikitext: str) -> str | None:
    m = TABBER_FEATURED_RE.search(wikitext)
    if m:
        return m.group(1).strip()
    m = GALLERY_FEATURED_RE.search(wikitext)
    if m:
        return m.group(1).strip()
    return None


def strip_wiki(s: str, keep_br: bool = False) -> str:
    """Convert wikitext to plain text. If keep_br, preserve <br> as | separator first."""
    if keep_br:
        s = re.sub(r"<br\s*/?>", "|", s, flags=re.IGNORECASE)
    s = re.sub(r"\[\[[^|\]]+\|([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.DOTALL)
    s = re.sub(r"<ref[^/]*/>", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"'''", "", s)
    s = re.sub(r"''", "", s)
    s = re.sub(r"\{\{[^}]+\}\}", "", s)
    return s.strip()


def split_list_field(raw: str) -> list[str]:
    """Split a wikitext field value that uses <br> (and sometimes commas)."""
    # Replace <br> with a sentinel BEFORE stripping HTML
    s = re.sub(r"<br\s*/?>", "|", raw, flags=re.IGNORECASE)
    s = strip_wiki(s)
    parts = [p.strip() for p in s.split("|")]
    return [p for p in parts if p]


def categorize_tags(tag_list: list[str]) -> dict:
    """Split MCOC tag list into structured fields. Tags look like:
      'Offensive: Damage Over Time', 'Defensive: Guard', 'Villain', 'Metal',
      'Size: M', 'Cabal'
    """
    out: dict = {"offensive": [], "defensive": [], "size": None, "other": []}
    for t in tag_list:
        if ":" in t:
            k, v = t.split(":", 1)
            k = k.strip().lower()
            v = v.strip()
            if k == "offensive":
                out["offensive"].append(v)
            elif k == "defensive":
                out["defensive"].append(v)
            elif k == "size":
                out["size"] = v
            else:
                out["other"].append(f"{k.title()}: {v}")
        else:
            out["other"].append(t)
    return out


def extract_immunities(abilities: list[str], wikitext: str) -> list[str]:
    """Pull explicit immunities from abilities list and from a dedicated section."""
    imm = set()
    for a in abilities:
        m = re.match(r"^(.+?)\s+Immunity\b", a, re.IGNORECASE)
        if m:
            imm.add(m.group(1).strip())
    # Also scan an Immunities section if present
    sec = IMMUNITIES_RE.search(wikitext)
    if sec:
        for line in strip_wiki(sec.group(1)).splitlines():
            line = line.strip(" *#")
            if line and len(line) < 60:
                # Take first capitalized phrase, e.g., "* Poison Immunity"
                m = re.search(r"([A-Z][A-Za-z\s\-]+?)\s+Immunity\b", line)
                if m:
                    imm.add(m.group(1).strip())
    return sorted(imm)


def parse_champion(title: str, wikitext: str) -> dict:
    cls = (CLASS_RE.search(wikitext).group(1).strip() if CLASS_RE.search(wikitext) else None)
    tags_raw = TAGS_RE.search(wikitext).group(1) if TAGS_RE.search(wikitext) else ""
    abilities_raw = ABILITIES_RE.search(wikitext).group(1) if ABILITIES_RE.search(wikitext) else ""
    sig = SIG_RE.search(wikitext).group(1).strip() if SIG_RE.search(wikitext) else None
    release = RELEASE_RE.search(wikitext).group(1).strip() if RELEASE_RE.search(wikitext) else None

    portrait = find_portrait(wikitext)
    featured = find_featured(wikitext)

    tiers = {f"tier{m.group(1)}": m.group(2).strip() for m in TIER_RE.finditer(wikitext)}

    bio = strip_wiki(BIO_RE.search(wikitext).group(1)) if BIO_RE.search(wikitext) else ""
    mechanics = (
        strip_wiki(MECHANICS_RE.search(wikitext).group(1)) if MECHANICS_RE.search(wikitext) else ""
    )

    tag_list = split_list_field(tags_raw)
    abilities = split_list_field(abilities_raw)
    tag_struct = categorize_tags(tag_list)
    immunities = extract_immunities(abilities, wikitext)

    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")

    return {
        "title": title,
        "slug": slug,
        "class": cls,
        "tags_raw": tag_list,
        "tags": tag_struct,
        "abilities": abilities,
        "immunities": immunities,
        "signature_ability": sig,
        "release_date": release,
        "portrait_file": portrait,
        "featured_file": featured,
        "tiers": tiers,
        "bio": bio[:2000],
        "mechanics": mechanics[:2000],
    }


CLASS_CODE_MAP = {
    "C": "Cosmic",
    "Te": "Tech",
    "Mu": "Mutant",
    "Sk": "Skill",
    "Sc": "Science",
    "My": "Mystic",
}


def fetch_master_list() -> list[dict]:
    """Pull canonical champion list from `Champions/Simple` (List of Champions/Simple redirects here).

    Entries look like `#{{Sc|Black Widow}}` where the short code is the class:
      Sc=Science, Sk=Skill, C=Cosmic, Mu=Mutant, My=Mystic, Te=Tech.
    Returns list of {name, class} dicts.
    """
    wt = fetch_wikitext("Champions/Simple")
    if not wt:
        return []
    # Only take entries from the Playable Champions section
    playable = wt.split("===Playable Champions===", 1)
    body = playable[1] if len(playable) > 1 else wt
    # Stop at next section header
    body = re.split(r"\n==", body, 1)[0]

    entries: dict[str, str] = {}
    for m in re.finditer(r"\{\{(C|Te|Mu|Sk|Sc|My)\|([^}|]+?)(?:\|[^}]*)?\}\}", body):
        code, name = m.group(1), m.group(2).strip()
        # First class wins (handles duplicates like Henchpool listed across classes)
        entries.setdefault(name, CLASS_CODE_MAP[code])
    return [{"name": n, "class": c} for n, c in sorted(entries.items())]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--skip-images", action="store_true")
    ap.add_argument("--names-only", action="store_true", help="just dump the master list")
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    print("[1/4] fetching master champion list...")
    roster = fetch_master_list()
    print(f"  -> {len(roster)} champions")
    (RAW / "champion_names.json").write_text(json.dumps(roster, indent=2))

    if args.names_only:
        return

    if args.limit:
        roster = roster[: args.limit]

    print(f"[2/4] fetching wikitext for {len(roster)} champions...")
    wt_dir = RAW / "wikitext"
    wt_dir.mkdir(parents=True, exist_ok=True)

    def safe_filename(s: str) -> str:
        return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")

    champions = []
    for i, entry in enumerate(roster, 1):
        name = entry["name"]
        cache = wt_dir / f"{safe_filename(name)}.wiki"
        if cache.exists():
            wt = cache.read_text()
        else:
            print(f"  [{i}/{len(roster)}] {name} (fetch)")
            wt = fetch_wikitext(name)
            if wt:
                cache.write_text(wt)
            time.sleep(SLEEP)
        if not wt:
            continue
        rec = parse_champion(name, wt)
        if not rec.get("class"):
            rec["class"] = entry["class"]
        champions.append(rec)

    (RAW / "champions.json").write_text(json.dumps(champions, indent=2))
    print(f"  -> wrote {len(champions)} champion records")

    if args.skip_images:
        print("[3/4] skipping image download (--skip-images)")
    else:
        print(f"[3/4] downloading portraits...")
        for i, c in enumerate(champions, 1):
            pf = c.get("portrait_file")
            if not pf:
                continue
            url = resolve_image_url(pf)
            if not url:
                continue
            ext = Path(pf).suffix or ".png"
            slug = re.sub(r"[^a-z0-9]+", "_", c["title"].lower()).strip("_")
            dest = IMG_DIR / f"{slug}{ext}"
            ok = download(url, dest)
            print(f"  [{i}/{len(champions)}] {c['title']} -> {dest.name} {'ok' if ok else 'FAIL'}")
            time.sleep(SLEEP)

    print("[4/4] fetching abilities + debuffs categories...")
    abilities = category_members("Abilities")
    debuffs = category_members("Debuffs")
    (RAW / "abilities.json").write_text(json.dumps(abilities, indent=2))
    (RAW / "debuffs.json").write_text(json.dumps(debuffs, indent=2))
    print(f"  -> {len(abilities)} abilities, {len(debuffs)} debuffs")

    print("done.")


if __name__ == "__main__":
    main()

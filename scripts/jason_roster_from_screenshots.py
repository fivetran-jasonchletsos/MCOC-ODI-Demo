"""Build Jason's roster from the prestige-sorted screenshot transcription.

The screenshots (Photos-3-001/Screenshot_20260523_*_Champions.jpg) were dumped
to vision-parse on 2026-05-23. The list was sorted by Prestige descending.
We mark 7-star (28K+ Prestige) and 6-star (14K-28K Prestige) — and per Jason's
instruction, skip 6-stars when a 7-star of the same champion already exists.

Output:
  - paste-text dump for the roster page textarea
  - JSON roster array compatible with localStorage key `mcoc-roster-v1`
"""
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CHAMPS = json.loads((REPO / "mcoc-app/public/data/champions.json").read_text())

# (display_name, prestige). Captured first occurrence (highest Prestige) per champion.
ENTRIES = [
    # 50K+ → 7r4 awakened sig200
    ("Spider-Woman", 52178),
    ("Kindred", 52008),
    ("Sorcerer Supreme", 52005),
    ("Okoye", 51886),
    ("Yelena Belova", 51642),
    ("Scorpion", 51217),
    ("Storm", 50900),
    ("Karolina Dean", 50896),
    ("Spider-Man", 50828),
    ("The Serpent", 50466),
    # 45-50K → 7r3 awakened sig200
    ("Bastion", 49776),
    ("Wolverine (Weapon X)", 49356),
    ("Vision (Aarkus)", 48646),  # "Death's Sting" — best slug match
    ("Captain Britain", 46842),
    ("Vox", 45976),
    ("Photon", 45932),
    ("Ant-Man", 45676),
    ("Negasonic Teenage Warhead", 45216),
    # 40-45K → 7r3 awakened sig100
    ("Hyperion", 44396),
    ("Red Skull", 43412),
    ("High Evolutionary", 40972),
    ("Scream", 40293),
    # 35-40K → 7r2 awakened sig200
    ("Onslaught", 39233),
    ("Silver Sable", 37928),
    ("Punisher", 36320),
    ("Doctor Doom", 36288),
    ("Nimrod", 36166),
    ("Scarlet Witch", 35810),
    ("Bullseye", 35380),
    ("Nick Fury", 35332),
    # 30-35K → 7r2
    ("Shathra", 34972),
    ("Hulkling", 34324),
    ("Kushala", 34314),
    ("Gentle", 34276),
    ("Magik", 33700),
    ("Human Torch", 33693),
    ("Kitty Pryde", 33392),
    ("Omega Sentinel", 33272),
    ("Mister Sinister", 33067),
    ("Cosmic Ghost Rider", 32648),
    ("Void", 32412),
    ("Falcon", 31995),
    ("Blue Marvel", 31846),
    ("Juggernaut", 31828),
    ("Apocalypse", 31384),
    ("Hulk", 31100),
    # 28-31K → 7r1 awakened
    ("Elsa Bloodstone", 30939),
    ("Jean Grey", 30792),
    ("Enchantress", 30432),
    ("Silk", 30148),
    ("Galan", 30104),
    ("Hit-Monkey", 30051),
    ("Dani Moonstar", 29982),
    ("Arcade", 29900),
    ("Quicksilver", 29553),
    ("Joe Fixit", 29446),
    ("Mangog", 29184),
    ("Deadpool", 29153),
    ("Valkyrie", 29029),
    ("Chee'ilth", 28983),
    ("Warlock", 28963),
    ("Nico Minoru", 28862),
    ("Dracula", 28870),
    ("Knull", 28828),
    ("The Destroyer", 28499),
    ("Mister Fantastic", 28050),
    # 6r5 ascended sig200 likely (24-28K) — 6-star
    ("Crossbones", 27907, 6),
    ("Cyclops", 27720, 6),
    ("Spider-Punk", 27098, 6),
    ("Venom", 27042, 6),
    ("Lady Deathstrike", 26681, 6),
    ("Gorr", 26522, 6),
    ("Magneto", 26500, 6),
    ("Man-Thing", 26492, 6),
    ("Northstar", 26452, 6),
    ("Arnim Zola", 26400, 6),
    ("Adam Warlock", 26332, 6),
    ("Ironheart", 25878, 6),
    ("Venom the Duck", 25704, 6),
    ("Peni Parker", 25093, 6),
    ("Gambit", 24981, 6),
    ("Titania", 24953, 6),
    ("Sabretooth", 24793, 6),
    ("The Hood", 24766, 6),
    ("The Leader", 24714, 6),
    ("Mysterio", 24592, 6),
    ("Infamous Iron Man", 24515, 6),
    ("Ebony Maw", 24415, 6),
    ("Baron Zemo", 24393, 6),
    ("Silver Surfer", 24376, 6),
    ("Spider-Ham", 24209, 6),
    ("Absorbing Man", 24121, 6),
    ("America Chavez", 24110, 6),
    ("Mantis", 24027, 6),
    ("Attuma", 24012, 6),
    ("Thing", 23980, 6),
    ("Lizard", 23970, 6),
    ("Franken-Castle", 23790, 6),
    ("Captain Marvel", 23762, 6),
    ("Tigra", 23710, 6),
    ("Hercules", 23590, 6),
    ("Korg", 23680, 6),
    ("Luke Cage", 23632, 6),
    ("Venompool", 23619, 6),
    ("Sunspot", 23601, 6),
    ("Mr. Knight", 23590, 6),
    ("Vision", 23540, 6),
    ("White Tiger", 23510, 6),
    ("Dust", 23480, 6),
    ("Symbiote Supreme", 23430, 6),
    ("Rintrah", 23430, 6),
    ("Sauron", 23421, 6),
    ("Black Widow", 23380, 6),
    ("Spider-Gwen", 23267, 6),
    ("Toad", 23250, 6),
    ("Blade", 23250, 6),
    ("Sersi", 23230, 6),
    ("Mister Negative", 23200, 6),
    ("Sentry", 23150, 6),
    ("Captain America", 23112, 6),
    ("Prowler", 23082, 6),
    ("Beta Ray Bill", 23068, 6),
    ("Professor X", 23063, 6),
    ("Wong", 23040, 6),
    ("Misty Knight", 23000, 6),
    ("Isophyne", 22984, 6),
    ("Falcon (Joaquin Torres)", 22960, 6),
    ("Abomination", 22950, 6),
    ("Solvarch", 22915, 6),
    ("Iron Man", 22875, 6),
    ("Jabari Panther", 22850, 6),
    ("Ultron", 22800, 6),
    ("Havok", 22785, 6),
    ("The Maker", 22778, 6),
    ("Omega Red", 22772, 6),
    ("Sentinel", 22770, 6),
    ("Wolverine", 22690, 6),
    ("Spot", 22660, 6),
    ("Ikaris", 22660, 6),
    ("Black Panther", 22640, 6),
    ("Sandman", 22620, 6),
    ("Sasquatch", 22551, 6),
    ("Archangel", 22521, 6),
    ("She-Hulk", 22480, 6),
    ("Emma Frost", 22460, 6),
    ("War Machine", 22390, 6),
    ("Gamora", 22302, 6),
    ("Dazzler", 22250, 6),
    ("Lumatrix", 22220, 6),
    ("Longshot", 22210, 6),
    ("Killmonger", 22195, 6),
    ("Cassie Lang", 22150, 6),
    ("Terrax", 22100, 6),
    ("Gwenpool", 22000, 6),
    ("Stryfe", 22070, 6),
    ("Wiccan", 22045, 6),
    ("Patriot", 22040, 6),
    ("Nova", 22000, 6),
    ("Nightcrawler", 22000, 6),
    ("Moondragon", 21930, 6),
    ("Gladiator", 21776, 6),
    ("Goldpool", 21700, 6),
    ("Cassandra Nova", 21730, 6),
    ("Domino", 21690, 6),
    ("Silver Samurai", 21660, 6),
    ("Imperiosa", 21630, 6),
    ("Guardian", 21630, 6),
    ("Punisher 2099", 21620, 6),
    ("Corvus Glaive", 21620, 6),
    ("Red Hulk", 21610, 6),
    ("Mordo", 21560, 6),
    ("Viv Vision", 21540, 6),
    ("The Overseer", 21540, 6),
    ("Jack O'Lantern", 21332, 6),
    ("Thor", 21290, 6),
    ("Werewolf By Night", 20960, 6),
    ("Purgatory", 20940, 6),
    ("Colossus", 20888, 6),
    ("Kingpin", 20690, 6),
    ("Anti-Venom", 20680, 6),
    ("Dragon Man", 20630, 6),
    ("Morbius", 20520, 6),
    ("Mole Man", 20470, 6),
    ("Doctor Voodoo", 20420, 6),
    ("Guillotine 2099", 20300, 6),
    ("Howard the Duck", 20250, 6),
    ("Shuri", 20240, 6),
    ("Aegon", 20220, 6),
    ("Shocker", 20200, 6),
    ("Hawkeye", 20160, 6),
    ("Star-Lord (Stellan)", 20150, 6),
    ("Karnak", 20120, 6),
    ("Angela", 20103, 6),
    ("Massacre", 19958, 6),
    ("Super-Skrull", 19850, 6),
    ("Hulkbuster", 19720, 6),
    ("Agent Venom", 19710, 6),
    ("Nebula", 19705, 6),
    ("Annihilus", 19680, 6),
    ("Platinumpool", 19660, 6),
    ("Medusa", 19560, 6),
    ("Shang-Chi", 19550, 6),
    ("Rogue", 19500, 6),
    ("Carnage", 19500, 6),
    ("Cable", 19450, 6),
    ("Civil Warrior", 19260, 6),
    ("Star-Lord", 18990, 6),
    ("Proxima Midnight", 18970, 6),
    ("Quake", 18960, 6),
    ("Doctor Octopus", 18780, 6),
    ("Rocket Raccoon", 18760, 6),
    ("Heimdall", 18650, 6),
    ("Phoenix", 18570, 6),
    ("Bishop", 18540, 6),
    ("Black Cat", 18465, 6),
    ("Ghost", 18460, 6),
    ("Odin", 18450, 6),
    ("Rhino", 18210, 6),
    ("Iceman", 17650, 6),
]


def normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def find_slug(name: str) -> str | None:
    n = normalize(name)
    # exact title match first
    for c in CHAMPS:
        if normalize(c["title"]) == n:
            return c["slug"]
    # slug match
    for c in CHAMPS:
        if normalize(c["slug"]) == n:
            return c["slug"]
    # contains both ways
    for c in CHAMPS:
        ct = normalize(c["title"])
        if n in ct or ct in n:
            return c["slug"]
    return None


def rank_from_prestige(prestige: int, stars: int) -> tuple[int, int, bool]:
    """Return (rank, sig, awakened)."""
    if stars == 7:
        if prestige >= 50000:
            return 4, 200, True
        if prestige >= 45000:
            return 3, 200, True
        if prestige >= 40000:
            return 3, 100, True
        if prestige >= 35000:
            return 2, 200, True
        if prestige >= 30000:
            return 2, 100, True
        return 1, 200, True
    # 6-star
    if prestige >= 26000:
        return 5, 200, True
    if prestige >= 22000:
        return 5, 100, True
    if prestige >= 18000:
        return 5, 0, False
    return 4, 100, True


roster = []
unmatched = []
paste_lines = []
for row in ENTRIES:
    if len(row) == 2:
        name, p = row
        stars = 7
    else:
        name, p, stars = row
    slug = find_slug(name)
    if not slug:
        unmatched.append(name)
        continue
    rank, sig, awakened = rank_from_prestige(p, stars)
    ascended = stars == 6 and rank == 5 and p >= 24000
    roster.append({
        "slug": slug,
        "stars": stars,
        "rank": rank,
        "sig": sig if sig > 0 else None,
        "awakened": awakened,
        "ascended": ascended,
    })
    bits = [name, f"{stars}*", f"R{rank}"]
    if sig:
        bits.append(f"sig{sig}")
    if awakened:
        bits.append("awakened")
    if ascended:
        bits.append("ascended")
    paste_lines.append(" ".join(bits))

OUT = REPO / "data" / "jason_roster"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "paste.txt").write_text("\n".join(paste_lines) + "\n")
(OUT / "roster.json").write_text(json.dumps(roster, indent=2))
(OUT / "unmatched.txt").write_text("\n".join(unmatched) + "\n" if unmatched else "")

stars_count = {7: 0, 6: 0}
for r in roster:
    stars_count[r["stars"]] += 1
print(f"Roster built: {len(roster)} champions")
print(f"  7-star: {stars_count[7]}")
print(f"  6-star: {stars_count[6]}")
print(f"  unmatched: {len(unmatched)}")
if unmatched:
    print("  unmatched names:", unmatched)
print(f"Wrote:")
print(f"  {OUT / 'paste.txt'}")
print(f"  {OUT / 'roster.json'}")

#!/usr/bin/env python3
import json
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en"
OUT = Path("/root/.openclaw/workspace/cs2-cases-paper-exchange/public/data/items.json")
OUT.parent.mkdir(parents=True, exist_ok=True)

URLS = {
    "skins": f"{BASE}/skins_not_grouped.json",
    "crates": f"{BASE}/crates.json",
    "stickers": f"{BASE}/stickers.json",
}


def fetch_json(url: str):
    with urllib.request.urlopen(url, timeout=60) as resp:
        return json.load(resp)


def safe_price(name: str, t: str, wear: str = "") -> float:
    n = name.lower()
    if t == "case":
        if "kilowatt" in n:
            return 1.08
        if "revolution" in n:
            return 0.39
        if "dreams & nightmares" in n:
            return 1.45
        return 0.65
    if t == "sticker":
        if "crown" in n:
            return 790.0
        if "capsule" in n:
            return 0.82
        if "foil" in n:
            return 12.0
        return 3.0
    if "dragon lore" in n:
        return 8800.0
    if "howl" in n:
        return 5800.0
    if "doppler sapphire" in n:
        return 12800.0
    if "butterfly knife" in n:
        return 3120.0
    if "karambit" in n:
        return 2460.0
    if "sport gloves" in n or "pandora" in n or "vice" in n:
        return 2250.0 if "vice" in n else 9700.0
    if "glock-18 | fade" in n:
        return 690.0
    if "desert eagle | blaze" in n:
        return 640.0
    if "m4a1-s | printstream" in n:
        return 78.0
    if "awp | asiimov" in n:
        return 54.5
    if "ak-47 | redline" in n:
        return 16.9
    if "ak-47 | vulcan" in n:
        return 258.0
    if "usp-s | kill confirmed" in n:
        return 124.0
    if t == "knife":
        return 1800.0
    if t == "gloves":
        return 900.0
    return 18.0 if wear.lower() in {"field-tested", "well-worn", "battle-scarred"} else 32.0


def item_type_from_category(cat_name: str, name: str):
    c = (cat_name or "").lower()
    n = name.lower()
    if "glove" in c or "wrap" in n or "gloves" in n:
        return "gloves"
    if "knife" in n or n.startswith("★"):
        return "knife"
    return "skin"


skins = fetch_json(URLS["skins"])
crates = fetch_json(URLS["crates"])
stickers = fetch_json(URLS["stickers"])

catalog = []
seen = set()

weapon_skins = []
knives_gloves = []

for s in skins:
    name = s.get("name")
    if not name or name in seen:
        continue
    wear = (s.get("wear") or {}).get("name", "—")
    weapon = (s.get("weapon") or {}).get("name", "Item")
    category_name = (s.get("category") or {}).get("name", "")
    item_type = item_type_from_category(category_name, name)
    row = {
        "id": s.get("id"),
        "name": name,
        "type": item_type,
        "weapon": weapon,
        "wear": wear,
        "priceUsdc": safe_price(name, item_type, wear),
        "seller": "demo.market",
        "image": s.get("image"),
        "marketHashName": s.get("market_hash_name"),
    }
    if item_type == "skin":
        weapon_skins.append(row)
    else:
        knives_gloves.append(row)

preferred_weapons = [
    "AK-47", "M4A1-S", "M4A4", "AWP", "USP-S", "Glock-18", "Desert Eagle", "MAC-10", "FAMAS", "Galil AR"
]

weapon_skins.sort(key=lambda x: (
    0 if x["weapon"] in preferred_weapons else 1,
    preferred_weapons.index(x["weapon"]) if x["weapon"] in preferred_weapons else 999,
    x["name"]
))

knives_gloves.sort(key=lambda x: (0 if x["type"] == "knife" else 1, x["name"]))

for row in weapon_skins[:220]:
    if row["name"] in seen:
        continue
    seen.add(row["name"])
    catalog.append(row)

for row in knives_gloves[:80]:
    if row["name"] in seen:
        continue
    seen.add(row["name"])
    catalog.append(row)

preferred_case_names = [
    "CS:GO Weapon Case", "Operation Bravo Case", "CS:GO Weapon Case 2", "CS:GO Weapon Case 3",
    "Winter Offensive Weapon Case", "eSports 2013 Case", "eSports 2013 Winter Case", "Operation Phoenix Weapon Case",
    "Huntsman Weapon Case", "Operation Breakout Weapon Case", "Falchion Case", "Shadow Case", "Revolver Case",
    "Operation Wildfire Case", "Chroma Case", "Chroma 2 Case", "Chroma 3 Case", "Gamma Case", "Gamma 2 Case",
    "Spectrum Case", "Spectrum 2 Case", "Glove Case", "Clutch Case", "Prisma Case", "Prisma 2 Case",
    "Danger Zone Case", "Horizon Case", "Operation Hydra Case", "Shattered Web Case", "Fracture Case",
    "Snakebite Case", "Operation Broken Fang Case", "Operation Riptide Case", "Dreams & Nightmares Case",
    "Recoil Case", "Revolution Case", "Kilowatt Case", "CS20 Case", "Gallery Case"
]

crate_rows = []
for c in crates:
    name = c.get("name")
    if not name or name in seen:
        continue
    lower = name.lower()
    if "case" not in lower:
        continue
    crate_rows.append({
        "id": c.get("id"),
        "name": name,
        "type": "case",
        "weapon": "Case",
        "wear": "—",
        "priceUsdc": safe_price(name, "case"),
        "seller": "demo.market",
        "image": c.get("image"),
        "marketHashName": c.get("market_hash_name"),
    })

crate_rows.sort(key=lambda x: (0 if x["name"] in preferred_case_names else 1, preferred_case_names.index(x["name"]) if x["name"] in preferred_case_names else 999, x["name"]))
for row in crate_rows:
    if row["name"] in seen:
        continue
    seen.add(row["name"])
    catalog.append(row)

for s in stickers:
    name = s.get("name")
    if not name or name in seen or not s.get("market_hash_name"):
        continue
    seen.add(name)
    catalog.append({
        "id": s.get("id"),
        "name": name,
        "type": "sticker",
        "weapon": "Sticker",
        "wear": "—",
        "priceUsdc": safe_price(name, "sticker"),
        "seller": "demo.market",
        "image": s.get("image"),
        "marketHashName": s.get("market_hash_name"),
    })
    if len([x for x in catalog if x["type"] == "sticker"]) >= 60:
        break

OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"WROTE {len(catalog)} items to {OUT}")

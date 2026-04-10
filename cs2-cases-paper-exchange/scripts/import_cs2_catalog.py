#!/usr/bin/env python3
import json
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en"
DATA_DIR = Path("/root/.openclaw/workspace/cs2-cases-paper-exchange/public/data")
OUT = DATA_DIR / "items.json"
ASSETS_OUT = DATA_DIR / "item-assets.json"
DATA_DIR.mkdir(parents=True, exist_ok=True)

URLS = {
    "skins": f"{BASE}/skins_not_grouped.json",
    "crates": f"{BASE}/crates.json",
    "stickers": f"{BASE}/stickers.json",
}


def fetch_json(url: str):
    with urllib.request.urlopen(url, timeout=120) as resp:
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


def rarity_payload(raw):
    if not raw:
        return {"name": "Consumer Grade", "color": "#b0c3d9"}
    return {
        "name": raw.get("name") or "Consumer Grade",
        "color": raw.get("color") or "#b0c3d9",
    }


skins = fetch_json(URLS["skins"])
crates = fetch_json(URLS["crates"])
stickers = fetch_json(URLS["stickers"])

catalog = []
assets = []
seen = set()

for s in skins:
    name = s.get("market_hash_name") or s.get("name")
    if not name or name in seen:
        continue
    wear = (s.get("wear") or {}).get("name", "—")
    weapon = (s.get("weapon") or {}).get("name", "Item")
    category_name = (s.get("category") or {}).get("name", "Skin")
    item_type = item_type_from_category(category_name, name)
    rarity = rarity_payload(s.get("rarity"))
    pattern = (s.get("pattern") or {}).get("name") or ""
    entry = {
        "id": s.get("id"),
        "name": name,
        "type": item_type,
        "weapon": weapon,
        "wear": wear,
        "category": category_name,
        "rarity": rarity,
        "pattern": pattern,
        "priceUsdc": safe_price(name, item_type, wear),
        "seller": "demo.market",
        "image": s.get("image"),
        "marketHashName": s.get("market_hash_name") or name,
    }
    catalog.append(entry)
    assets.append({
        "id": entry["id"],
        "name": entry["name"],
        "type": entry["type"],
        "category": entry["category"],
        "rarity": rarity,
        "image": entry["image"],
        "marketHashName": entry["marketHashName"],
    })
    seen.add(name)

for c in crates:
    name = c.get("market_hash_name") or c.get("name")
    if not name or name in seen:
        continue
    lower = name.lower()
    if "case" not in lower:
        continue
    rarity = {"name": "Container", "color": "#e4ae39"}
    entry = {
        "id": c.get("id"),
        "name": name,
        "type": "case",
        "weapon": "Case",
        "wear": "—",
        "category": "Case",
        "rarity": rarity,
        "pattern": "",
        "priceUsdc": safe_price(name, "case"),
        "seller": "demo.market",
        "image": c.get("image"),
        "marketHashName": c.get("market_hash_name") or name,
    }
    catalog.append(entry)
    assets.append({k: entry[k] for k in ["id", "name", "type", "category", "rarity", "image", "marketHashName"]})
    seen.add(name)

for s in stickers:
    name = s.get("market_hash_name") or s.get("name")
    if not name or name in seen or not s.get("market_hash_name"):
        continue
    rarity = rarity_payload(s.get("rarity"))
    entry = {
        "id": s.get("id"),
        "name": name,
        "type": "sticker",
        "weapon": "Sticker",
        "wear": "—",
        "category": "Sticker",
        "rarity": rarity,
        "pattern": "",
        "priceUsdc": safe_price(name, "sticker"),
        "seller": "demo.market",
        "image": s.get("image"),
        "marketHashName": s.get("market_hash_name"),
    }
    catalog.append(entry)
    assets.append({k: entry[k] for k in ["id", "name", "type", "category", "rarity", "image", "marketHashName"]})
    seen.add(name)

catalog.sort(key=lambda x: (x["weapon"], x["name"]))
assets.sort(key=lambda x: x["name"])

OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
ASSETS_OUT.write_text(json.dumps(assets, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"WROTE {len(catalog)} items to {OUT}")
print(f"WROTE {len(assets)} assets to {ASSETS_OUT}")

#!/usr/bin/env python3
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

APP_ID = 730
CURRENCY = 1  # USD
ITEMS_PATH = Path('/root/.openclaw/workspace/cs2-cases-paper-exchange/public/data/items.json')


def fetch_price(market_hash_name: str):
    qs = urllib.parse.urlencode({
        'appid': APP_ID,
        'currency': CURRENCY,
        'market_hash_name': market_hash_name,
    })
    url = f'https://steamcommunity.com/market/priceoverview/?{qs}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def parse_price_to_float(price_str: str | None):
    if not price_str:
        return None
    s = price_str.replace('$', '').replace('USD', '').replace(',', '').strip()
    try:
        return float(s)
    except Exception:
        return None


def main():
    items = json.loads(ITEMS_PATH.read_text(encoding='utf-8'))
    updated = 0
    checked = 0

    for item in items:
        mh = item.get('marketHashName') or item.get('name')
        if not mh:
            continue
        checked += 1
        try:
            data = fetch_price(mh)
            if data.get('success'):
                price_text = data.get('lowest_price') or data.get('median_price')
                price_val = parse_price_to_float(price_text)
                if price_val is not None:
                    item['priceUsdc'] = price_val
                item['steamPriceText'] = price_text
                item['steamVolume'] = data.get('volume')
                item['steamFetchedAt'] = int(time.time())
                updated += 1
            else:
                item['steamPriceText'] = None
        except Exception as e:
            item['steamPriceError'] = str(e)
        time.sleep(1.2)

    ITEMS_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'checked={checked} updated={updated}')


if __name__ == '__main__':
    main()

# ARC Steam Market — CS2 Marketplace Demo

A demo storefront for **buying and selling CS2 items**, designed as a product prototype for future **ARC** settlement and **USDC**-based payments.

This is **not** the final market backend and not a production exchange. Right now this repository serves as:
- a product prototype for review;
- a UI/UX demo of the future marketplace;
- a showcase storefront for the item catalog, cards, search, filters, and demo listings.

## What it is right now

The current version is a **search-first marketplace beta** with:
- a CS2 item catalog;
- ARC wallet connect;
- Steam OpenID account connection;
- Steam trade-link verification;
- Steam inventory sync;
- Steam price visibility in inventory and marketplace;
- grouped / ungrouped case mode in inventory;
- estimated total Steam inventory value;
- an initial buyer-signed payment flow for USDC settlement;
- profile-based trading restrictions through verification gating.

## Repository contents

### Frontend demo
- `public/index.html`
- `public/styles.css`
- `public/app.js`

This is where the demo storefront lives:
- the item card grid;
- the selected item flow;
- quick marketplace actions;
- development-facing helper blocks.

### Demo catalog
- `public/data/items.json`

The item catalog used by the storefront UI.

### Import scripts
- `scripts/import_cs2_catalog.py`
- `scripts/update_steam_prices.py`

These are used to:
- rebuild the local catalog from open CS2 data sources;
- pull approximate Steam prices for the demo experience.

## Updating the catalog

### 1. Rebuild the item catalog

```bash
python3 scripts/import_cs2_catalog.py
```

What it does:
- pulls open CS2 item data;
- rebuilds `items.json`;
- stores skins, cases, knives, gloves, and stickers in storefront format.

### 2. Pull approximate Steam prices

```bash
python3 scripts/update_steam_prices.py
```

What it does:
- walks through `market_hash_name` values;
- pulls `lowest_price / median_price / volume` from Steam Community Market;
- updates catalog prices.

## Data sources

The demo currently uses practical open sources:
- an open CS2 item dataset / JSON API for names, types, and image URLs;
- Steam Community Market for approximate reference prices.

## Current limitations

It is important to treat this as a **beta layer**, not a finished product.

What is still missing:
- real user-generated listings;
- full escrow / custody execution;
- complete RPC-based onchain payment validation;
- seller payout flow;
- production-grade moderation and anti-abuse;
- a finished admin / dispute layer;
- ARC mainnet settlement.

## Why it looks like this

This project is intentionally moving away from a “trading terminal” idea and toward an **item marketplace**, where the main job is to:
- find an item quickly;
- see the card and its price;
- understand the asset type;
- complete a buy / offer flow;
- eventually connect that flow to P2P + escrow + ARC settlement.

## Current build

Already implemented in the current beta:
- ARC wallet connect
- Steam OpenID account connection
- Steam trade-link verification
- Profile-based trading restrictions
- Steam inventory sync
- Steam price display for inventory and marketplace visibility
- Group / ungroup inventory view for cases
- Inventory value estimation
- Initial buyer-signed USDC payment flow

## Planned next

Planned next milestones:
- Real RPC-based payment validation
- Listing flow for user-owned items
- Sell-side dashboard and my listings
- Purchase history / trade history / payment history
- Custody / escrow flow for item delivery
- Admin panel for operations and dispute handling
- Market price layer beyond Steam reference prices
- Seller payout flow
- Security review and production hardening

## Positioning for review

If the repository is being reviewed by people deciding whether to approve the project, the right framing is:

**This is the product-layer demo of a future CS2 marketplace**, and it already shows:
- the visual direction;
- the structure of the item catalog;
- the model for cards and search;
- the approach to demo data and price references;
- the path toward ARC + USDC settlement.

## Commit policy going forward

From here it makes sense to keep history cleaner:
- commit less often, but in larger logical chunks;
- use meaningful commit messages instead of micro-step messages;
- combine small edits into coherent change sets when possible;
- keep history readable before external reviews and releases.

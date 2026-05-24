# ARC Steam Trade Bot

This folder contains the first service skeleton for Steam trade delivery.

The current implementation is intentionally safe-by-default:

- It starts in dry-run mode.
- It stores local development jobs in JSON.
- It validates delivery jobs before sending.
- It does not require Steam credentials unless live mode is enabled.
- It keeps secrets in `.env`, not in Git.

## Folder Structure

```text
tradebots/steam/
  package.json
  .env.example
  src/
    index.js
    config.js
    logger.js
    bot-manager.js
    order-store.js
    trade-offer-policy.js
    adapters/
      mock-steam-adapter.js
      steam-offer-adapter.js
    stores/
      json-store.js
```

## Local Dry Run

```powershell
cd tradebots\steam
npm.cmd run start
```

Optional demo job:

```powershell
$env:TRADEBOT_SEED_DEMO_ORDER="true"
npm.cmd run start
```

## Live Mode Plan

Live mode is not enabled by default. Before turning it on:

1. Install and audit Steam bot dependencies.
2. Add bot account credentials through environment variables.
3. Wire backend order queue integration.
4. Run with low-value test items.
5. Add manual review workflow.

## Job Shape

```json
{
  "id": "order_123",
  "listingId": "listing_456",
  "buyerSteamId64": "76561190000000000",
  "buyerTradeUrl": "https://steamcommunity.com/tradeoffer/new/?partner=...",
  "assetIds": ["123456789"],
  "marketHashName": "AK-47 | Redline (Field-Tested)",
  "status": "queued"
}
```

## Statuses

- `queued`
- `validated`
- `offer_sent`
- `accepted`
- `failed`
- `manual_review`

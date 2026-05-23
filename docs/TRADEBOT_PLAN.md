# Steam Trade Bot Plan

## Goal

Build a Steam trade bot service that receives paid marketplace orders, creates Steam trade offers, tracks delivery, and reports status back to the exchange backend.

## Non-Goals for the First Bot Milestone

- No secrets in Git.
- No auto-withdrawal without verified payment and trade link.
- No bypass of Steam Guard, confirmations, or inventory privacy rules.
- No production custody until queueing, logging, and retry behavior are tested.

## Bot Responsibilities

- Log in to Steam with a dedicated bot account.
- Keep session cookies fresh.
- Read bot inventory.
- Validate that requested asset IDs exist and are tradable.
- Create trade offers to the buyer Steam trade URL.
- Attach marketplace order IDs to trade offer metadata.
- Poll trade offer state.
- Retry transient Steam failures.
- Mark orders delivered, failed, or requiring manual review.

## Service Boundaries

The bot should not decide pricing or custody rules. It should receive explicit commands from the exchange backend:

```json
{
  "orderId": "order_123",
  "listingId": "listing_456",
  "buyerSteamId64": "7656119...",
  "buyerTradeUrl": "https://steamcommunity.com/tradeoffer/new/?partner=...",
  "assetIds": ["123456789"],
  "marketHashName": "AK-47 | Redline (Field-Tested)"
}
```

## Milestones

### M1: Local Bot Skeleton

- Add config loader.
- Add adapter interface.
- Add mock adapter for local testing.
- Add queue processor.
- Add JSON session/order store for development.
- Add README and `.env.example`.

### M2: Steam Adapter

- Wire `steam-user`.
- Wire `steamcommunity`.
- Wire `steam-tradeoffer-manager`.
- Load credentials only from environment variables.
- Support login and Steam Guard shared secret.
- Support trade offer send in dry-run and live mode.

### M3: Backend Integration

- Add authenticated HTTP endpoint or queue consumer.
- Accept delivery jobs from the exchange backend.
- Emit status events back to backend.
- Store trade offer IDs and state transitions.

### M4: Operations

- Add structured logs.
- Add alerting on failed confirmations.
- Add bot health endpoint.
- Add manual review queue.
- Add rate-limit and cooldown handling.

## Required Secrets

These must stay outside Git:

- `STEAM_BOT_USERNAME`
- `STEAM_BOT_PASSWORD`
- `STEAM_BOT_SHARED_SECRET`
- `STEAM_BOT_IDENTITY_SECRET`
- `STEAM_API_KEY`
- `TRADEBOT_API_TOKEN`

## Safety Rules

- Never accept or create offers for unverified orders.
- Never send offers before payment confirmation.
- Never log raw Steam credentials, shared secrets, identity secrets, or cookies.
- Always bind trade offers to an internal `orderId`.
- Always support manual cancellation and review.

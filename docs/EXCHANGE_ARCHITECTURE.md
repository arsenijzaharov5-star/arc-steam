# Exchange Architecture

## Current Runtime

The current app is a marketplace beta focused on CS2 skins, Steam identity, wallet settlement, and Steam inventory/listing flows.

Main layers:

- Frontend marketplace UI - market, inventory, profile, buy modal, wallet modal.
- Catalog data - CS2 item metadata, images, types, rarity, and market hash names.
- Pricing layer - SteamApis/Steam reference prices with fallback demo prices.
- Steam layer - OpenID profile connection, trade-link verification, public inventory sync.
- Wallet layer - EVM wallet connection and demo purchase transaction creation.
- Future backend layer - persistent listings, orders, trade bot delivery jobs, payment verification.

## Data Flow

### Catalog

1. The browser loads catalog item data.
2. The market renders an initial page.
3. `Show more` expands the visible catalog without hardcoding item cards.
4. User listings should be prepended to the market item source before filtering and sorting.

### Pricing

1. Cards first render with cached or fallback prices.
2. Visible cards request a pricing endpoint by `marketHashName`.
3. The server checks local cache.
4. If needed, it calls SteamApis or a Steam fallback.
5. The UI updates visible cards, modal price, and chart base price.

### Steam Profile and Inventory

1. User clicks `Connect Steam`.
2. Browser redirects to Steam OpenID.
3. Steam returns to the app callback.
4. The server verifies OpenID and stores profile data.
5. Inventory loads from Steam Community public inventory endpoint.
6. Inventory cards are rendered and can be grouped by case type.

### Wallet

1. User clicks `Connect wallet`.
2. Wallet chooser opens.
3. User selects MetaMask, Rabby, Coinbase, or detected browser wallet.
4. App requests accounts and switches/adds ARC Testnet.
5. The UI stores connected wallet state for the session and reads native balance.

### Listing Flow

1. User opens `Inventory`.
2. User clicks `List`.
3. The trade modal switches into listing mode.
4. User enters listing price in USDC.
5. App creates an active listing.
6. Listing appears at the top of the market.
7. Inventory item shows listed state.

### Purchase Flow

1. User clicks `Buy`.
2. Modal shows item, market price chart, and checkout steps.
3. User confirms purchase.
4. App creates an EVM transaction for the item price.
5. Successful transaction creates a purchase record.
6. Purchase appears in profile history as a market-style card.
7. If the purchased item was a user listing, it is marked as sold.

## Production Backend Shape

The demo should evolve toward a backend with these core entities:

- `User`: wallet, Steam ID, trade link, risk flags.
- `InventoryItem`: Steam asset metadata and owner.
- `Listing`: seller, item, price, status, created/updated timestamps.
- `Order`: buyer, seller, listing, payment transaction, delivery state.
- `TradeOffer`: Steam offer ID, bot account, status, retry metadata.
- `AuditLog`: immutable operational events for support and reporting.

## Suggested Order States

```text
draft_listing
active_listing
purchase_started
payment_pending
payment_confirmed
trade_offer_queued
trade_offer_sent
trade_offer_accepted
delivered
cancelled
failed
refunded
```

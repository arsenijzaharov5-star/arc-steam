# Project Status

Date: 2026-05-24

## Product State

The project is an ARC CS2 skins market demo with storefront, Steam profile/inventory integration, SteamApis pricing, wallet connection, demo checkout, purchase history, and inventory listing work in progress.

## Completed Marketplace Features

- Full CS2 catalog is loaded from data instead of hardcoded item cards.
- The `All` catalog view is randomized and no longer alphabetically sorted.
- Market item cards load real item images and visible prices.
- Prices use SteamApis with a cache layer when configured.
- Favorites can be toggled from item hearts and favorite items are prioritized in market sorting.
- Steam OpenID connection flow is wired.
- Steam profile data is displayed in the profile view.
- Steam inventory can be loaded from public CS2 inventories.
- Inventory case grouping works without page refresh.
- Inventory items can be prepared for listing through the sell flow.
- Wallet connection uses a chooser modal for common EVM wallets.
- Demo checkout creates a wallet transaction for the item price in USDC terms.
- Purchases are expected to render in profile history as market-style skin cards.
- Buy modal, chart rendering, and candlestick generation were upgraded for a more market-like experience.

## Current Demo Boundaries

- Listings and purchase history are still demo-level state until backend persistence is completed.
- Checkout settlement needs final ARC USDC production semantics.
- Steam trade delivery is not yet executed by a backend or Steam bot.
- There is no production order database yet.
- Trade offers, escrow, dispute handling, and seller payout settlement are not production-ready.

## Next Priorities

1. Define a backend order model for listing, purchase, payment, and delivery states.
2. Implement Steam trade bot infrastructure around a queue-driven order processor.
3. Add server-side listing persistence and replace local-only market state.
4. Add trade offer creation, confirmation monitoring, retry, cancellation, and audit logs.
5. Decide whether ARC USDC is native or ERC-20 for production payments.

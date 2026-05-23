# Marketplace Progress Report

Date: 2026-05-24

## Summary

The marketplace demo is moving from a static storefront toward an exchange prototype. It now has catalog loading, Steam pricing direction, wallet connection, demo checkout, inventory listing, purchase history, and profile integration. The next major milestone is a backend-backed listing/order system and Steam trade bot delivery.

## Completed Since Initial Restore

- Rebuilt the CS2 skins market UI around the saved marketplace visual direction.
- Connected the catalog to real CS2 item data and images.
- Added lazy loading for the full catalog.
- Added randomized `All` catalog order.
- Added favorites and favorite-prioritized sorting.
- Connected Steam OpenID profile flow.
- Loaded Steam inventory from public CS2 inventory endpoints.
- Added grouped inventory view for duplicate cases.
- Integrated SteamApis pricing with local cache direction.
- Replaced visible item price currency labels with `USDC` where settlement is shown.
- Added realistic seeded 30-day candlestick charts.
- Added wallet chooser and EVM wallet connection.
- Added demo purchase transaction creation.
- Added market purchase history direction as skin cards in profile.
- Added inventory item listing flow.

## Current Risks

- Marketplace state is still demo/local until backend persistence is completed.
- Steam delivery is not automated yet.
- Payment flow is a demo transaction, not final production settlement logic.
- There is no backend reconciliation between payment, order state, and Steam delivery.
- Steam bot credentials and operational safety need strict handling before live testing.

## Recommended Next Work

1. Implement backend order and listing persistence.
2. Build Steam trade bot service from the new `tradebots/steam` skeleton.
3. Connect bot delivery jobs to paid marketplace orders.
4. Add admin/support views for failed or pending trade offers.
5. Add production payment confirmation logic.

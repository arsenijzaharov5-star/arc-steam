# Arc Steam Marketplace MVP

MVP for a cs.money-like Steam items marketplace with Arc-native USDC settlement.

## Included in this first scaffold
- Next.js app router project
- Prisma schema
- Landing page
- Marketplace page
- Listing detail page
- Sell page scaffold
- Dashboard scaffold
- Admin summary page
- API routes for listings and orders

## Main idea
- Wallet-native auth layer
- Steam items listed inside the site
- Buyers pay in Arc USDC
- Orders are created on-site
- Delivery happens offchain via Steam trade
- Payouts happen after fulfillment

## Next steps
1. Add wallet connect
2. Add real form actions for create listing / buy item
3. Add auth/session model
4. Add admin order actions
5. Add payout workflow
6. Add trade hold tracking
7. Replace SQLite with Postgres

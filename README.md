# Arc Steam Marketplace Beta

Beta build of a CS2 skins marketplace with **Arc-native USDC settlement**, **Steam account verification**, **inventory sync**, and an early **wallet-native payment flow**.

## Current build
- ARC wallet connect
- Correct Arc Testnet wallet network configuration
- Steam OpenID account connection
- Steam trade-link verification
- Steam inventory sync into the site
- Steam price visibility in inventory and marketplace
- Group / ungroup inventory mode for cases
- Inventory value estimation
- Initial buyer-signed USDC payment flow
- Profile-based restrictions for trading actions

## Main idea
- Wallet-native user flow instead of mandatory pre-funded internal balances
- Steam identity and trade-link verification before sensitive trading actions
- Steam items surfaced directly inside the site
- Buyers sign payments from their wallet in Arc USDC
- Delivery happens offchain through Steam trade / future custody flow
- Onchain settlement plus offchain item execution

## Planned next
1. Add real RPC-based payment validation
2. Implement listing flow for user-owned Steam items
3. Add sell-side dashboard (my listings / my sales / payment history)
4. Build custody / escrow flow for item delivery
5. Add admin operations panel and dispute handling
6. Add market price layer beyond Steam reference prices
7. Add seller payout flow
8. Harden security, monitoring, and abuse protection

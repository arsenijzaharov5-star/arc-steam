# ARC CS2 Marketplace Documentation

This folder is the GitHub-facing documentation hub for product reports, exchange architecture, and the Steam trade bot roadmap.

## Documents

- [Project status](./PROJECT_STATUS.md) - current feature state, completed work, and open risks.
- [Exchange architecture](./EXCHANGE_ARCHITECTURE.md) - frontend, pricing, wallet, inventory, listing, and purchase flows.
- [Steam trade bot plan](./TRADEBOT_PLAN.md) - phased backend and bot integration plan.
- [Progress report 2026-05-24](./reports/2026-05-24-marketplace-progress.md) - report-ready milestone summary.

## Reporting Cadence

Recommended GitHub reporting flow:

1. Create a weekly report issue from `.github/ISSUE_TEMPLATE/marketplace-report.md`.
2. Link merged PRs and local verification notes.
3. Keep user-facing marketplace changes separate from bot/backend infrastructure changes.
4. Record known limitations and next decisions before starting implementation-heavy work.

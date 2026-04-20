# ARC Steam Market — CS2 Marketplace Demo

Демо‑витрина маркетплейса для **покупки и продажи предметов CS2** с прицелом на будущий settlement через **ARC** и газ/расчёты в **USDC**.

Это **не финальный market backend** и не production exchange. Сейчас репозиторий нужен как:
- продуктовый прототип для review;
- UI/UX демо будущего маркетплейса;
- демонстрационный storefront для каталога предметов, карточек, поиска, фильтров и демо‑листингов.

## Что это сейчас

Текущая версия — это **search-first marketplace beta**, где уже есть:
- каталог предметов CS2;
- ARC wallet connect;
- Steam OpenID account connection;
- верификация Steam trade link;
- Steam inventory sync;
- отображение Steam prices в inventory и marketplace;
- grouped / ungrouped режим для кейсов в inventory;
- оценка общей стоимости Steam inventory;
- базовый buyer-signed payment flow под USDC settlement;
- ограничения торговых действий через profile + verification gating.

## Что внутри репозитория

### Frontend demo
- `public/index.html`
- `public/styles.css`
- `public/app.js`

Там живёт demo storefront:
- список карточек;
- карточка выбранного предмета;
- демо‑блок быстрых действий;
- служебные dev‑таблицы.

### Demo catalog
- `public/data/items.json`

Каталог предметов для витрины. Сейчас используется как источник данных для интерфейса.

### Import scripts
- `scripts/import_cs2_catalog.py`
- `scripts/update_steam_prices.py`

Они нужны, чтобы:
- пересобирать локальный каталог из открытых источников данных по CS2;
- подтягивать примерные цены из Steam для демо‑версии.

## Обновление каталога

### 1. Пересобрать каталог предметов

```bash
python3 scripts/import_cs2_catalog.py
```

Что делает:
- тянет открытые данные по CS2 предметам;
- собирает `items.json`;
- сохраняет скины, кейсы, ножи, перчатки и стикеры в storefront‑формате.

### 2. Подтянуть примерные цены из Steam

```bash
python3 scripts/update_steam_prices.py
```

Что делает:
- проходит по `market_hash_name`;
- тянет `lowest_price / median_price / volume` из Steam Community Market;
- обновляет цены в каталоге.

## Источники данных

Сейчас демо использует открытые и технически удобные источники:
- открытый CS2 item dataset / JSON API для названий, типов и image URLs;
- Steam Community Market для примерных демо‑цен.

## Ограничения текущей версии

Важно понимать, что это пока **beta‑слой**, а не завершённый продукт.

Сейчас **ещё нет**:
- настоящих пользовательских листингов;
- реального escrow/custody исполнения;
- полноценной RPC‑валидации onchain оплат;
- seller payout flow;
- production‑уровня moderation и anti‑abuse;
- завершённого admin/dispute слоя;
- onchain settlement через ARC mainnet.

## Почему это выглядит именно так

Мы сознательно ушли от идеи “трейдинг‑терминала” и строим не графиковую биржу, а **маркетплейс предметов**, где главное:
- быстро найти предмет;
- увидеть карточку и цену;
- понять тип ассета;
- оформить покупку / оффер;
- дальше перевести это в P2P + escrow + ARC settlement.

## Current build

Что уже внедрено в текущую beta-версию:
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

Что планируем делать дальше:
- Real RPC-based payment validation
- Listing flow for user-owned items
- Sell-side dashboard and my listings
- Purchase history / trade history / payment history
- Custody / escrow flow for item delivery
- Admin panel for operations and dispute handling
- Market price layer beyond Steam reference prices
- Seller payout flow
- Security review and production hardening

## Позиционирование для review

Если репозиторий читают люди, которые будут аппрувить проект, то правильно смотреть на него так:

**Это демонстрационный продуктовый слой будущего CS2 marketplace**, который уже показывает:
- визуальное направление;
- структуру каталога предметов;
- модель карточек и поиска;
- подход к демо‑данным и рыночным price references;
- подготовку к ARC + USDC settlement flow.

## Commit policy дальше

Дальше имеет смысл держать историю чище:
- делать **реже, но крупнее** коммиты;
- писать **смысловые сообщения**, а не микрошаги;
- по возможности объединять мелкие правки в один логический change set;
- перед внешними review/release — держать историю аккуратной и читаемой.

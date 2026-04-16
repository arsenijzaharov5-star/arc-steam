# ARC Steam Market — CS2 Marketplace Demo

Демо‑витрина маркетплейса для **покупки и продажи предметов CS2** с прицелом на будущий settlement через **ARC** и газ/расчёты в **USDC**.

Это **не финальный market backend** и не production exchange. Сейчас репозиторий нужен как:
- продуктовый прототип для review;
- UI/UX демо будущего маркетплейса;
- демонстрационный storefront для каталога предметов, карточек, поиска, фильтров и демо‑листингов.

## Что это сейчас

Текущая версия — это **search-first marketplace demo**, где уже есть:
- каталог предметов CS2;
- реальные image URLs для части каталога из открытого CS2 item dataset;
- демо‑цены, частично подтянутые из Steam Community Market;
- витрина карточек скинов, ножей, перчаток, кейсов и стикеров;
- поиск по названию предмета;
- фильтрация по типу предмета;
- подготовленный UI под будущий P2P / escrow flow.

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

Важно понимать, что это пока **демо‑слой**, а не завершённый продукт.

Сейчас **ещё нет**:
- настоящих пользовательских листингов;
- реального escrow/custody исполнения;
- Steam inventory sync;
- настоящей торговой логики order flow;
- auth / wallet ownership proof / profile system;
- production‑уровня moderation и anti‑abuse;
- onchain settlement через ARC mainnet.

## Почему это выглядит именно так

Мы сознательно ушли от идеи “трейдинг‑терминала” и строим не графиковую биржу, а **маркетплейс предметов**, где главное:
- быстро найти предмет;
- увидеть карточку и цену;
- понять тип ассета;
- оформить покупку / оффер;
- дальше перевести это в P2P + escrow + ARC settlement.

## Roadmap

### Phase 1 — Demo storefront
- [x] Базовая витрина предметов
- [x] Поиск по названию
- [x] Фильтры по типу предмета
- [x] Локальный каталог предметов
- [x] Реальные image URLs для каталога
- [x] Частичная подгрузка примерных Steam‑цен

### Phase 2 — Better marketplace presentation
- [ ] Пагинация / lazy loading каталога
- [ ] Улучшенный sorting и featured sections
- [ ] Отдельные блоки popular / cases / high value / recent
- [ ] Нормальная карточка предмета / item detail page
- [ ] Избранное / watchlist

### Phase 3 — Marketplace logic
- [ ] Создание demo listings
- [ ] Demo offers / accept / reject flow
- [ ] Личный inventory view
- [ ] My listings / my offers / recent sales
- [ ] Escrow state machine в демо‑виде

### Phase 4 — ARC integration
- [ ] Wallet connect
- [ ] USDC settlement UX
- [ ] ARC transaction states
- [ ] Onchain/offchain order lifecycle
- [ ] События исполнения и payout states

### Phase 5 — Production readiness
- [ ] Steam account linking
- [ ] Steam trade delivery flow
- [ ] Auth / profile / reputation
- [ ] Admin / moderation / dispute flow
- [ ] Security review
- [ ] Observability / logging / abuse protection

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

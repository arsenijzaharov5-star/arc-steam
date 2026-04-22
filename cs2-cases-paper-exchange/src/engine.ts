import { db } from "./db";
import { Side } from "./types";

const accountId = 1;

function nowIso() {
  return new Date().toISOString();
}

export function getInstrumentBySymbol(symbol: string) {
  return db.prepare("SELECT id, symbol, name FROM instruments WHERE symbol = ?").get(symbol) as
    | { id: number; symbol: string; name: string }
    | undefined;
}

export function getLatestPrice(instrumentId: number): number {
  const row = db
    .prepare("SELECT price FROM price_ticks WHERE instrument_id = ? ORDER BY id DESC LIMIT 1")
    .get(instrumentId) as { price: number } | undefined;
  if (!row) throw new Error("No price data");
  return row.price;
}

export function addTick(symbol: string, driftPct = 0) {
  const inst = getInstrumentBySymbol(symbol);
  if (!inst) throw new Error("Unknown symbol");
  const prev = getLatestPrice(inst.id);
  const randomPct = (Math.random() - 0.5) * 0.02;
  const next = Math.max(0.1, prev * (1 + randomPct + driftPct));
  db.prepare("INSERT INTO price_ticks (instrument_id, ts, price, volume) VALUES (?, ?, ?, ?)").run(
    inst.id,
    nowIso(),
    Number(next.toFixed(4)),
    Number((10 + Math.random() * 90).toFixed(2))
  );

  runLiquidationChecks(inst.id, next);
  return next;
}

function getAccountBase() {
  return db.prepare("SELECT id, balance, realized_pnl FROM account WHERE id = ?").get(accountId) as {
    id: number;
    balance: number;
    realized_pnl: number;
  };
}

function getOpenPositions() {
  return db.prepare("SELECT * FROM positions WHERE account_id = ? AND status = 'open'").all(accountId) as Array<{
    id: number;
    instrument_id: number;
    side: Side;
    size: number;
    entry_price: number;
    leverage: number;
    margin: number;
    status: string;
  }>;
}

function pnlFor(side: Side, entry: number, mark: number, size: number) {
  return side === "long" ? (mark - entry) * size : (entry - mark) * size;
}

function liquidationPrice(side: Side, entry: number, leverage: number) {
  const frac = 1 / leverage * 0.8;
  return side === "long" ? entry * (1 - frac) : entry * (1 + frac);
}

export function getAccountSnapshot() {
  const acc = getAccountBase();
  const positions = getOpenPositions();
  let usedMargin = 0;
  let unrealized = 0;
  for (const p of positions) {
    const mark = getLatestPrice(p.instrument_id);
    usedMargin += p.margin;
    unrealized += pnlFor(p.side, p.entry_price, mark, p.size);
  }

  const equity = acc.balance + unrealized;
  return {
    id: acc.id,
    balance: Number(acc.balance.toFixed(4)),
    equity: Number(equity.toFixed(4)),
    usedMargin: Number(usedMargin.toFixed(4)),
    freeMargin: Number((acc.balance - usedMargin).toFixed(4)),
    unrealizedPnl: Number(unrealized.toFixed(4)),
    realizedPnl: Number(acc.realized_pnl.toFixed(4))
  };
}

function insertOrder(params: {
  instrumentId: number;
  side: Side;
  size: number;
  leverage: number;
  price: number;
  status: "filled" | "rejected";
  reason?: string;
}) {
  db.prepare(
    `INSERT INTO orders (account_id, instrument_id, side, size, type, leverage, price, status, reason, created_at)
     VALUES (?, ?, ?, ?, 'market', ?, ?, ?, ?, ?)`
  ).run(
    accountId,
    params.instrumentId,
    params.side,
    params.size,
    params.leverage,
    params.price,
    params.status,
    params.reason ?? null,
    nowIso()
  );
}

export function placeMarketOrder(symbol: string, side: Side, size: number, leverage: number) {
  const inst = getInstrumentBySymbol(symbol);
  if (!inst) throw new Error("Unknown symbol");
  const price = getLatestPrice(inst.id);
  const notional = size * price;
  const orderMargin = notional / leverage;

  const account = getAccountSnapshot();
  if (orderMargin > account.freeMargin + 1e-9) {
    insertOrder({ instrumentId: inst.id, side, size, leverage, price, status: "rejected", reason: "Insufficient margin" });
    return { ok: false, reason: "Insufficient margin" };
  }

  const existing = db
    .prepare("SELECT * FROM positions WHERE account_id = ? AND instrument_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1")
    .get(accountId, inst.id) as
    | {
        id: number;
        side: Side;
        size: number;
        entry_price: number;
        leverage: number;
        margin: number;
      }
    | undefined;

  const tx = db.transaction(() => {
    if (!existing) {
      db.prepare(
        `INSERT INTO positions (account_id, instrument_id, side, size, entry_price, leverage, margin, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
      ).run(accountId, inst.id, side, size, price, leverage, orderMargin, nowIso(), nowIso());
      return;
    }

    if (existing.side === side) {
      const newSize = existing.size + size;
      const newEntry = (existing.entry_price * existing.size + price * size) / newSize;
      const newMargin = existing.margin + orderMargin;
      db.prepare("UPDATE positions SET size = ?, entry_price = ?, margin = ?, leverage = ?, updated_at = ? WHERE id = ?").run(
        newSize,
        newEntry,
        newMargin,
        leverage,
        nowIso(),
        existing.id
      );
      return;
    }

    // opposite side -> reduce/close/flip
    const reduce = Math.min(existing.size, size);
    const realized = pnlFor(existing.side, existing.entry_price, price, reduce);
    db.prepare("UPDATE account SET balance = balance + ?, realized_pnl = realized_pnl + ? WHERE id = ?").run(realized, realized, accountId);

    if (size < existing.size) {
      // partial close
      const ratio = (existing.size - reduce) / existing.size;
      db.prepare("UPDATE positions SET size = ?, margin = ?, updated_at = ? WHERE id = ?").run(
        existing.size - reduce,
        existing.margin * ratio,
        nowIso(),
        existing.id
      );
      return;
    }

    if (size === existing.size) {
      db.prepare("UPDATE positions SET status = 'closed', size = 0, margin = 0, updated_at = ? WHERE id = ?").run(nowIso(), existing.id);
      return;
    }

    // flip
    db.prepare("UPDATE positions SET status = 'closed', size = 0, margin = 0, updated_at = ? WHERE id = ?").run(nowIso(), existing.id);
    const newSize = size - existing.size;
    const newMargin = (newSize * price) / leverage;
    db.prepare(
      `INSERT INTO positions (account_id, instrument_id, side, size, entry_price, leverage, margin, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`
    ).run(accountId, inst.id, side, newSize, price, leverage, newMargin, nowIso(), nowIso());
  });

  tx();
  insertOrder({ instrumentId: inst.id, side, size, leverage, price, status: "filled" });
  return { ok: true };
}

function runLiquidationChecks(instrumentId: number, mark: number) {
  const positions = db.prepare("SELECT * FROM positions WHERE instrument_id = ? AND account_id = ? AND status = 'open'").all(
    instrumentId,
    accountId
  ) as Array<{ id: number; side: Side; size: number; entry_price: number; margin: number; leverage: number }>;

  const tx = db.transaction(() => {
    for (const p of positions) {
      const liq = liquidationPrice(p.side, p.entry_price, p.leverage);
      const shouldLiq = p.side === "long" ? mark <= liq : mark >= liq;
      if (!shouldLiq) continue;

      const realized = pnlFor(p.side, p.entry_price, mark, p.size);
      db.prepare("UPDATE account SET balance = balance + ?, realized_pnl = realized_pnl + ? WHERE id = ?").run(realized, realized, accountId);
      db.prepare("UPDATE positions SET status = 'liquidated', size = 0, margin = 0, updated_at = ? WHERE id = ?").run(nowIso(), p.id);
    }
  });

  tx();
}

export function listPositions() {
  const rows = db.prepare(
    `SELECT p.*, i.symbol
     FROM positions p
     JOIN instruments i ON i.id = p.instrument_id
     WHERE p.account_id = ? AND p.status = 'open'
     ORDER BY p.id DESC`
  ).all(accountId) as Array<{
    id: number;
    account_id: number;
    instrument_id: number;
    symbol: string;
    side: Side;
    size: number;
    entry_price: number;
    leverage: number;
    margin: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((r) => {
    const mark = getLatestPrice(r.instrument_id);
    const unreal = pnlFor(r.side, r.entry_price, mark, r.size);
    return {
      id: r.id,
      accountId: r.account_id,
      instrumentId: r.instrument_id,
      symbol: r.symbol,
      side: r.side,
      size: Number(r.size.toFixed(4)),
      entryPrice: Number(r.entry_price.toFixed(4)),
      markPrice: Number(mark.toFixed(4)),
      leverage: r.leverage,
      margin: Number(r.margin.toFixed(4)),
      unrealizedPnl: Number(unreal.toFixed(4)),
      liquidationPrice: Number(liquidationPrice(r.side, r.entry_price, r.leverage).toFixed(4)),
      status: "open",
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  });
}

export function listOrders(limit = 50) {
  return db.prepare(
    `SELECT o.*, i.symbol
     FROM orders o
     JOIN instruments i ON i.id = o.instrument_id
     WHERE o.account_id = ?
     ORDER BY o.id DESC
     LIMIT ?`
  ).all(accountId, limit);
}

export function listInstruments() {
  return db
    .prepare("SELECT id, symbol, name FROM instruments WHERE symbol LIKE 'CASE_%' ORDER BY name")
    .all();
}

export function listPrices(symbol: string, limit = 120) {
  const inst = getInstrumentBySymbol(symbol);
  if (!inst) throw new Error("Unknown symbol");
  return db
    .prepare(
      `SELECT id, instrument_id as instrumentId, ts, price, volume
       FROM price_ticks
       WHERE instrument_id = ?
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(inst.id, limit)
    .reverse();
}

export function listCandles(symbol: string, timeframe = "1m", limit = 200) {
  const inst = getInstrumentBySymbol(symbol);
  if (!inst) throw new Error("Unknown symbol");

  const tfMap: Record<string, number> = {
    "1m": 60_000,
    "5m": 300_000,
    "15m": 900_000,
    "1h": 3_600_000
  };
  const tfMs = tfMap[timeframe] ?? tfMap["1m"];

  const ticks = db
    .prepare(
      `SELECT ts, price, volume
       FROM price_ticks
       WHERE instrument_id = ?
       ORDER BY id ASC`
    )
    .all(inst.id) as Array<{ ts: string; price: number; volume: number }>;

  const buckets = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();

  for (const t of ticks) {
    const ms = Date.parse(t.ts);
    const bucket = Math.floor(ms / tfMs) * tfMs;
    const prev = buckets.get(bucket);
    if (!prev) {
      buckets.set(bucket, { open: t.price, high: t.price, low: t.price, close: t.price, volume: t.volume });
      continue;
    }
    prev.high = Math.max(prev.high, t.price);
    prev.low = Math.min(prev.low, t.price);
    prev.close = t.price;
    prev.volume += t.volume;
  }

  const candles = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, c]) => ({
      time: Math.floor(time / 1000),
      open: Number(c.open.toFixed(4)),
      high: Number(c.high.toFixed(4)),
      low: Number(c.low.toFixed(4)),
      close: Number(c.close.toFixed(4)),
      volume: Number(c.volume.toFixed(2))
    }));

  return candles.slice(-Math.max(10, limit));
}

export function resetSimulation() {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM orders WHERE account_id = ?").run(accountId);
    db.prepare("DELETE FROM positions WHERE account_id = ?").run(accountId);
    db.prepare("UPDATE account SET balance = 100000, realized_pnl = 0 WHERE id = ?").run(accountId);
  });
  tx();
}

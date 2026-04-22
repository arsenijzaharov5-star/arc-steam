import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { CS2_CASE_INSTRUMENTS, toSymbol } from "./instruments";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "exchange.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS instruments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instrument_id INTEGER NOT NULL,
  ts TEXT NOT NULL,
  price REAL NOT NULL,
  volume REAL NOT NULL,
  FOREIGN KEY(instrument_id) REFERENCES instruments(id)
);

CREATE TABLE IF NOT EXISTS account (
  id INTEGER PRIMARY KEY,
  balance REAL NOT NULL,
  realized_pnl REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  instrument_id INTEGER NOT NULL,
  side TEXT NOT NULL,
  size REAL NOT NULL,
  entry_price REAL NOT NULL,
  leverage REAL NOT NULL,
  margin REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(instrument_id) REFERENCES instruments(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  instrument_id INTEGER NOT NULL,
  side TEXT NOT NULL,
  size REAL NOT NULL,
  type TEXT NOT NULL,
  leverage REAL NOT NULL,
  price REAL NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(instrument_id) REFERENCES instruments(id)
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  steam_id TEXT,
  steam_name TEXT,
  steam_avatar TEXT,
  steam_trade_link TEXT,
  trade_link_verified INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  amount_usdc REAL NOT NULL,
  recipient_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  tx_hash TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  expires_at TEXT NOT NULL
);
`);

const defaultInstruments = CS2_CASE_INSTRUMENTS.map((name) => ({
  symbol: toSymbol(name),
  name
}));

const upsertInstrument = db.prepare(
  `INSERT INTO instruments (symbol, name) VALUES (?, ?) ON CONFLICT(symbol) DO UPDATE SET name=excluded.name`
);
for (const i of defaultInstruments) upsertInstrument.run(i.symbol, i.name);


const hasAccount = db.prepare("SELECT 1 FROM account WHERE id = 1").get();
if (!hasAccount) {
  db.prepare("INSERT INTO account (id, balance, realized_pnl) VALUES (1, ?, 0)").run(100000);
}

function seedTicksForMissingInstruments() {
  const instruments = db.prepare("SELECT id, symbol FROM instruments").all() as Array<{ id: number; symbol: string }>;
  const getCount = db.prepare("SELECT COUNT(*) as c FROM price_ticks WHERE instrument_id = ?");
  const insert = db.prepare("INSERT INTO price_ticks (instrument_id, ts, price, volume) VALUES (?, ?, ?, ?)");

  const tx = db.transaction(() => {
    const now = Date.now();
    for (const inst of instruments) {
      const row = getCount.get(inst.id) as { c: number };
      if (row.c > 0) continue;

      let price = 15 + Math.random() * 140;
      for (let i = 120; i >= 0; i--) {
        price = Math.max(0.1, price * (1 + ((Math.random() - 0.5) * 0.02)));
        insert.run(inst.id, new Date(now - i * 60_000).toISOString(), Number(price.toFixed(4)), Number((10 + Math.random() * 90).toFixed(2)));
      }
    }
  });

  tx();
}

try {
  db.exec("ALTER TABLE profile ADD COLUMN steam_avatar TEXT");
} catch {}

seedTicksForMissingInstruments();

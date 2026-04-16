import express from "express";
import cors from "cors";
import path from "node:path";
import { z } from "zod";
import { db } from "./db";
import {
  addTick,
  getAccountSnapshot,
  listInstruments,
  listOrders,
  listPositions,
  listPrices,
  listCandles,
  placeMarketOrder,
  resetSimulation
} from "./engine";

const app = express();
app.use(cors());
app.use(express.json());

const STEAM_ID_BASE = BigInt("76561197960265728");
const STEAM_OPENID = "https://steamcommunity.com/openid/login";

function getBaseUrl(req: express.Request) {
  const forwardedProto = req.header("x-forwarded-proto");
  const proto = forwardedProto || req.protocol || "http";
  const host = req.header("x-forwarded-host") || req.header("host") || "localhost:5177";
  return `${proto}://${host}`;
}

function getReturnTo(req: express.Request) {
  return `${getBaseUrl(req)}/auth/steam/return`;
}

function extractPartnerValue(tradeLink?: string) {
  if (!tradeLink) return null;
  try {
    const url = new URL(tradeLink);
    return url.searchParams.get("partner");
  } catch {
    return null;
  }
}

function partnerToSteamId64(partner: string) {
  return (BigInt(partner) + STEAM_ID_BASE).toString();
}

function getProfile() {
  return db.prepare("SELECT id, steam_id as steamId, steam_name as steamName, steam_trade_link as steamTradeLink, trade_link_verified as tradeLinkVerified, updated_at as updatedAt FROM profile WHERE id = 1").get() as
    | { steamId: string | null; steamName: string | null; steamTradeLink: string | null; tradeLinkVerified: number; updatedAt: string }
    | undefined;
}

function isVerifiedProfile() {
  const profile = getProfile();
  return Boolean(profile?.steamId && profile?.steamTradeLink && profile?.tradeLinkVerified === 1);
}

const ARC_PAYMENT_CONFIG = {
  chainId: 5042002,
  recipientAddress: "0x1111111111111111111111111111111111111111",
  tokenAddress: "0x0000000000000000000000000000000000000000"
};

function nowIso() {
  return new Date().toISOString();
}

function saveSteamIdentity(steamId: string, steamName?: string | null) {
  const existing = getProfile();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO profile (id, steam_id, steam_name, steam_trade_link, trade_link_verified, updated_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       steam_id = excluded.steam_id,
       steam_name = excluded.steam_name,
       steam_trade_link = excluded.steam_trade_link,
       trade_link_verified = excluded.trade_link_verified,
       updated_at = excluded.updated_at`
  ).run(
    steamId,
    steamName ?? existing?.steamName ?? null,
    existing?.steamTradeLink ?? null,
    existing?.tradeLinkVerified ?? 0,
    now
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get("/auth/steam", (req, res) => {
  const realm = getBaseUrl(req);
  const returnTo = getReturnTo(req);
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
  });
  res.redirect(`${STEAM_OPENID}?${params.toString()}`);
});

app.get("/auth/steam/return", async (req, res) => {
  const claimedId = String(req.query["openid.claimed_id"] || "");
  const returnTo = getReturnTo(req);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      params.set(key, String(value[0]));
    } else if (value != null) {
      params.set(key, String(value));
    }
  }
  params.set("openid.mode", "check_authentication");
  params.set("openid.return_to", returnTo);

  try {
    const verifyRes = await fetch(STEAM_OPENID, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    const verifyText = await verifyRes.text();
    if (!verifyText.includes("is_valid:true")) {
      return res.redirect("/?steam=invalid#profile-view");
    }

    const match = claimedId.match(/\/id\/(\d+)$/);
    if (!match) {
      return res.redirect("/?steam=invalid#profile-view");
    }

    saveSteamIdentity(match[1], getProfile()?.steamName ?? null);
    return res.redirect("/?steam=connected#profile-view");
  } catch {
    return res.redirect("/?steam=error#profile-view");
  }
});

app.get("/api/instruments", (_req, res) => {
  res.json(listInstruments());
});

app.get("/api/account", (_req, res) => {
  res.json(getAccountSnapshot());
});

app.get("/api/profile", (_req, res) => {
  res.json(getProfile() ?? {
    steamId: null,
    steamName: null,
    steamTradeLink: null,
    tradeLinkVerified: 0,
    updatedAt: null
  });
});

const profileSchema = z.object({
  steamId: z.string().trim().min(5),
  steamName: z.string().trim().min(1),
  steamTradeLink: z.string().trim().url()
});

app.post("/api/profile", (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { steamId, steamName, steamTradeLink } = parsed.data;
  const partner = extractPartnerValue(steamTradeLink);
  if (!partner) {
    return res.status(400).json({ error: "Trade link is invalid: missing partner parameter" });
  }

  try {
    const derivedSteamId = partnerToSteamId64(partner);
    if (derivedSteamId !== steamId) {
      return res.status(400).json({ error: "Trade link does not match connected Steam account" });
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO profile (id, steam_id, steam_name, steam_trade_link, trade_link_verified, updated_at)
       VALUES (1, ?, ?, ?, 1, ?)
       ON CONFLICT(id) DO UPDATE SET
         steam_id = excluded.steam_id,
         steam_name = excluded.steam_name,
         steam_trade_link = excluded.steam_trade_link,
         trade_link_verified = excluded.trade_link_verified,
         updated_at = excluded.updated_at`
    ).run(steamId, steamName, steamTradeLink, now);

    return res.json(getProfile());
  } catch {
    return res.status(400).json({ error: "Trade link partner value is invalid" });
  }
});

app.get("/api/positions", (_req, res) => {
  res.json(listPositions());
});

app.get("/api/purchase-orders", (_req, res) => {
  const rows = db.prepare(
    `SELECT id, item_id as itemId, item_name as itemName, buyer_wallet as buyerWallet, amount_usdc as amountUsdc, recipient_address as recipientAddress, token_address as tokenAddress, chain_id as chainId, status, tx_hash as txHash, created_at as createdAt, paid_at as paidAt, expires_at as expiresAt
     FROM purchase_orders
     ORDER BY id DESC
     LIMIT 20`
  ).all();
  res.json(rows);
});

const createPurchaseSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  amountUsdc: z.number().positive(),
  buyerWallet: z.string().min(10)
});

app.post("/api/purchase/create", (req, res) => {
  if (!isVerifiedProfile()) {
    return res.status(403).json({ error: "Steam profile and trade link must be verified before purchase." });
  }

  const parsed = createPurchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { itemId, itemName, amountUsdc, buyerWallet } = parsed.data;
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();

  const result = db.prepare(
    `INSERT INTO purchase_orders (item_id, item_name, buyer_wallet, amount_usdc, recipient_address, token_address, chain_id, status, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?)`
  ).run(itemId, itemName, buyerWallet, amountUsdc, ARC_PAYMENT_CONFIG.recipientAddress, ARC_PAYMENT_CONFIG.tokenAddress, ARC_PAYMENT_CONFIG.chainId, createdAt, expiresAt);

  const order = db.prepare(
    `SELECT id, item_id as itemId, item_name as itemName, buyer_wallet as buyerWallet, amount_usdc as amountUsdc, recipient_address as recipientAddress, token_address as tokenAddress, chain_id as chainId, status, tx_hash as txHash, created_at as createdAt, paid_at as paidAt, expires_at as expiresAt
     FROM purchase_orders WHERE id = ?`
  ).get(result.lastInsertRowid);

  return res.json(order);
});

const confirmPurchaseSchema = z.object({
  orderId: z.number().int().positive(),
  txHash: z.string().min(10)
});

app.post("/api/purchase/confirm", (req, res) => {
  const parsed = confirmPurchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { orderId, txHash } = parsed.data;
  const order = db.prepare(`SELECT * FROM purchase_orders WHERE id = ?`).get(orderId) as any;
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (Date.parse(order.expires_at) < Date.now()) {
    db.prepare("UPDATE purchase_orders SET status = 'expired' WHERE id = ?").run(orderId);
    return res.status(400).json({ error: "Order expired" });
  }

  db.prepare("UPDATE purchase_orders SET status = 'payment_submitted', tx_hash = ?, paid_at = ? WHERE id = ?").run(txHash, nowIso(), orderId);
  const updated = db.prepare(
    `SELECT id, item_id as itemId, item_name as itemName, buyer_wallet as buyerWallet, amount_usdc as amountUsdc, recipient_address as recipientAddress, token_address as tokenAddress, chain_id as chainId, status, tx_hash as txHash, created_at as createdAt, paid_at as paidAt, expires_at as expiresAt
     FROM purchase_orders WHERE id = ?`
  ).get(orderId);
  return res.json({ ok: true, order: updated, note: "Payment submitted. RPC validation will be the next step." });
});

app.get("/api/orders", (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  res.json(listOrders(Number.isFinite(limit) ? limit : 50));
});

app.get("/api/prices/:symbol", (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 120);
    const rows = listPrices(req.params.symbol, Number.isFinite(limit) ? limit : 120);
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/candles/:symbol", (req, res) => {
  try {
    const tf = String(req.query.tf ?? "1m");
    const limit = Number(req.query.limit ?? 200);
    const rows = listCandles(req.params.symbol, tf, Number.isFinite(limit) ? limit : 200);
    res.json(rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

const orderSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["long", "short"]),
  size: z.number().positive(),
  leverage: z.number().min(1).max(20),
  type: z.literal("market").default("market")
});

app.post("/api/orders", (req, res) => {
  if (!isVerifiedProfile()) {
    return res.status(403).json({ error: "Steam profile and trade link must be verified before trading." });
  }

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { symbol, side, size, leverage } = parsed.data;
  try {
    const result = placeMarketOrder(symbol, side, size, leverage);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.json({ ok: true, account: getAccountSnapshot(), positions: listPositions() });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

const tickSchema = z.object({
  symbol: z.string().min(1),
  driftPct: z.number().min(-0.1).max(0.1).optional()
});

app.post("/api/sim/tick", (req, res) => {
  const parsed = tickSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const next = addTick(parsed.data.symbol, parsed.data.driftPct ?? 0);
    return res.json({ ok: true, nextPrice: next, account: getAccountSnapshot() });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

app.post("/api/sim/reset", (_req, res) => {
  resetSimulation();
  res.json({ ok: true });
});

const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT ?? 5177);
app.listen(port, () => {
  console.log(`CS2 cases paper exchange running on http://localhost:${port}`);
});

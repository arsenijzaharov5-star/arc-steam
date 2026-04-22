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
  return db.prepare("SELECT id, steam_id as steamId, steam_name as steamName, steam_avatar as steamAvatar, steam_trade_link as steamTradeLink, trade_link_verified as tradeLinkVerified, updated_at as updatedAt FROM profile WHERE id = 1").get() as
    | { steamId: string | null; steamName: string | null; steamAvatar: string | null; steamTradeLink: string | null; tradeLinkVerified: number; updatedAt: string }
    | undefined;
}

async function fetchSteamProfileSummary(steamId: string) {
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${steamId}?xml=1`, {
      headers: { "user-agent": "Mozilla/5.0" }
    });
    if (!response.ok) return null;
    const xml = await response.text();
    const name = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/)?.[1] || xml.match(/<steamID>(.*?)<\/steamID>/)?.[1] || null;
    const avatar = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/)?.[1] || xml.match(/<avatarFull>(.*?)<\/avatarFull>/)?.[1] || null;
    return { steamName: name, steamAvatar: avatar };
  } catch {
    return null;
  }
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

function saveSteamIdentity(steamId: string, steamName?: string | null, steamAvatar?: string | null) {
  const existing = getProfile();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO profile (id, steam_id, steam_name, steam_avatar, steam_trade_link, trade_link_verified, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       steam_id = excluded.steam_id,
       steam_name = excluded.steam_name,
       steam_avatar = excluded.steam_avatar,
       steam_trade_link = excluded.steam_trade_link,
       trade_link_verified = excluded.trade_link_verified,
       updated_at = excluded.updated_at`
  ).run(
    steamId,
    steamName ?? existing?.steamName ?? null,
    steamAvatar ?? existing?.steamAvatar ?? null,
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

    const steamId = match[1];
    const summary = await fetchSteamProfileSummary(steamId);
    saveSteamIdentity(steamId, summary?.steamName ?? getProfile()?.steamName ?? null, summary?.steamAvatar ?? getProfile()?.steamAvatar ?? null);
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

app.get("/api/profile", async (_req, res) => {
  const profile = getProfile();
  if (profile?.steamId && (!profile.steamAvatar || !profile.steamName || String(profile.steamName).startsWith('Steam '))) {
    const summary = await fetchSteamProfileSummary(profile.steamId);
    if (summary?.steamName || summary?.steamAvatar) {
      saveSteamIdentity(profile.steamId, summary?.steamName ?? profile.steamName, summary?.steamAvatar ?? profile.steamAvatar);
    }
  }

  res.json(getProfile() ?? {
    steamId: null,
    steamName: null,
    steamAvatar: null,
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

const steamPriceCache = new Map<string, { value: string; ts: number }>();

function parseSteamPriceToNumber(price?: string) {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const match = cleaned.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

async function fetchSteamPrice(marketHashName: string) {
  const cached = steamPriceCache.get(marketHashName);
  if (cached && Date.now() - cached.ts < 10 * 60_000) return cached.value;

  const url = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0"
      }
    });
    if (!response.ok) return "—";
    const data = await response.json() as any;
    const value = data?.lowest_price || data?.median_price || "—";
    steamPriceCache.set(marketHashName, { value, ts: Date.now() });
    return value;
  } catch {
    return "—";
  }
}

app.get("/api/steam/price", async (req, res) => {
  const marketHashName = String(req.query.marketHashName || "").trim();
  if (!marketHashName) {
    return res.status(400).json({ error: "marketHashName is required" });
  }
  const steamPrice = await fetchSteamPrice(marketHashName);
  return res.json({ marketHashName, steamPrice, priceUsdc: parseSteamPriceToNumber(steamPrice) });
});

app.get("/api/steam/inventory", async (_req, res) => {
  const profile = getProfile();
  if (!profile?.steamId) {
    return res.status(400).json({ error: "Steam is not connected" });
  }

  const appId = 730;
  const contextId = 2;
  const allAssets: any[] = [];
  const allDescriptions: any[] = [];
  let startAssetId: string | undefined;

  try {
    for (let page = 0; page < 10; page += 1) {
      const url = `https://steamcommunity.com/inventory/${profile.steamId}/${appId}/${contextId}?l=english&count=200${startAssetId ? `&start_assetid=${startAssetId}` : ""}`;
      const response = await fetch(url, {
        headers: {
          "accept": "application/json, text/plain, */*",
          "user-agent": "Mozilla/5.0"
        }
      });
      if (!response.ok) {
        return res.status(502).json({ error: `Steam inventory fetch failed with ${response.status}` });
      }
      const data = await response.json() as any;
      allAssets.push(...(Array.isArray(data.assets) ? data.assets : []));
      allDescriptions.push(...(Array.isArray(data.descriptions) ? data.descriptions : []));
      if (!data.more_items || !data.last_assetid) break;
      startAssetId = String(data.last_assetid);
    }

    const descMap = new Map(allDescriptions.map((d: any) => [`${d.classid}_${d.instanceid}`, d]));
    const marketNames = Array.from(new Set(allAssets.map((asset: any, idx: number) => {
      const desc = descMap.get(`${asset.classid}_${asset.instanceid}`) || {};
      return desc.market_hash_name || desc.name || `CS2 Item ${idx + 1}`;
    })));
    const priceEntries = await Promise.all(marketNames.map(async (name) => [name, await fetchSteamPrice(name)] as const));
    const priceMap = new Map(priceEntries);

    const items = allAssets.map((asset: any, idx: number) => {
      const desc = descMap.get(`${asset.classid}_${asset.instanceid}`) || {};
      const marketName = desc.market_hash_name || desc.name || `CS2 Item ${idx + 1}`;
      const tags = Array.isArray(desc.tags) ? desc.tags : [];
      const exterior = tags.find((t: any) => t.category === "Exterior")?.localized_tag_name || "—";
      const weapon = marketName.includes("|") ? marketName.split("|")[0].trim() : (tags.find((t: any) => t.category === "Weapon")?.localized_tag_name || "CS2 item");
      const type = tags.find((t: any) => t.category === "Type")?.localized_tag_name || "Item";
      const rarity = tags.find((t: any) => t.category === "Rarity");
      const steamPrice = priceMap.get(marketName) || "—";
      const ownerDescriptions = Array.isArray(desc.owner_descriptions) ? desc.owner_descriptions : [];
      const fraudWarnings = Array.isArray(desc.fraudwarnings) ? desc.fraudwarnings : [];
      const allFlags = `${ownerDescriptions.map((x: any) => x.value || '').join(' ')} ${fraudWarnings.join(' ')}`.toLowerCase();
      const tradableFlag = Number(desc.tradable ?? 1) === 1;
      const marketableFlag = Number(desc.marketable ?? 1) === 1;
      const permanentlyBound = /non[- ]?tradable|cannot be traded|not tradable|cannot be listed|commodity not marketable|cannot be marketed/.test(allFlags);
      const tradeable = tradableFlag && marketableFlag && !permanentlyBound;
      return {
        id: `${asset.assetid}`,
        assetId: asset.assetid,
        classId: asset.classid,
        marketHashName: marketName,
        name: marketName,
        weapon,
        wear: exterior,
        type: /knife/i.test(type) ? "knife" : /glove/i.test(type) ? "gloves" : /sticker/i.test(type) ? "sticker" : /case|container/i.test(type) ? "case" : "skin",
        category: type,
        seller: profile.steamName || "You",
        inventoryStatus: "in inventory",
        image: desc.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}/360fx360f` : undefined,
        rarity: rarity ? { name: rarity.localized_tag_name, color: rarity.color ? `#${rarity.color}` : "#ff8fb1" } : { name: "Steam item", color: "#ff8fb1" },
        steamPrice,
        marketPrice: "—",
        priceUsdc: parseSteamPriceToNumber(steamPrice),
        tradable: tradeable
      };
    });

    return res.json(items);
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || "Steam inventory fetch failed" });
  }
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

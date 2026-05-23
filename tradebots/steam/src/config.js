const path = require("path");

function loadDotEnvIfPresent() {
  try {
    require("dotenv").config();
  } catch {
    // dotenv is optional for syntax checks and dry-run local scaffolding.
  }
}

function boolEnv(name, fallback = false) {
  const value = String(process.env[name] || "").toLowerCase();
  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;
  return fallback;
}

function intEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function loadConfig() {
  loadDotEnvIfPresent();
  const mode = process.env.TRADEBOT_MODE || "dry-run";
  return {
    mode,
    dryRun: mode !== "live",
    pollIntervalMs: intEnv("TRADEBOT_POLL_INTERVAL_MS", 15000),
    seedDemoOrder: boolEnv("TRADEBOT_SEED_DEMO_ORDER", false),
    orderStorePath: path.resolve(process.cwd(), process.env.TRADEBOT_ORDER_STORE_PATH || "./data/orders.json"),
    sessionStorePath: path.resolve(process.cwd(), process.env.TRADEBOT_SESSION_STORE_PATH || "./data/session.json"),
    apiToken: process.env.TRADEBOT_API_TOKEN || "",
    steam: {
      username: process.env.STEAM_BOT_USERNAME || "",
      password: process.env.STEAM_BOT_PASSWORD || "",
      sharedSecret: process.env.STEAM_BOT_SHARED_SECRET || "",
      identitySecret: process.env.STEAM_BOT_IDENTITY_SECRET || "",
      apiKey: process.env.STEAM_API_KEY || ""
    }
  };
}

function validateConfig(config) {
  if (config.dryRun) return [];
  const requiredSteamEnv = [
    ["STEAM_BOT_USERNAME", config.steam.username],
    ["STEAM_BOT_PASSWORD", config.steam.password],
    ["STEAM_BOT_SHARED_SECRET", config.steam.sharedSecret],
    ["STEAM_BOT_IDENTITY_SECRET", config.steam.identitySecret],
    ["STEAM_API_KEY", config.steam.apiKey]
  ];
  const missing = requiredSteamEnv.filter(([, value]) => !value).map(([name]) => name);
  if (!config.apiToken) missing.push("TRADEBOT_API_TOKEN");
  return missing;
}

module.exports = { loadConfig, validateConfig };

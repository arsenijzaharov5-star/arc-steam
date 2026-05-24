const { loadConfig, validateConfig } = require("./config");
const logger = require("./logger");
const { TradeOrderStore } = require("./order-store");
const { TradeBotManager } = require("./bot-manager");

function demoOrder() {
  return {
    id: `demo-order-${Date.now()}`,
    listingId: "demo-listing-1",
    buyerSteamId64: "76561190000000000",
    buyerTradeUrl: "https://steamcommunity.com/tradeoffer/new/?partner=000000000&token=demo",
    assetIds: ["123456789"],
    marketHashName: "AK-47 | Redline (Field-Tested)",
    status: "queued",
    createdAt: new Date().toISOString()
  };
}

async function main() {
  const config = loadConfig();
  const missing = validateConfig(config);
  if (missing.length) {
    logger.error("trade bot config is missing required live-mode env vars", { missing });
    process.exitCode = 1;
    return;
  }

  const orderStore = new TradeOrderStore(config.orderStorePath);
  if (config.seedDemoOrder) {
    const order = orderStore.upsert(demoOrder());
    logger.info("seeded demo delivery job", { orderId: order.id });
  }

  const manager = new TradeBotManager(config, orderStore, logger);
  await manager.start();
  await manager.processOnce();

  if (config.dryRun) {
    logger.info("dry-run complete");
    return;
  }

  setInterval(() => {
    manager.processOnce().catch((error) => {
      logger.error("trade bot loop failed", { error: error.message });
    });
  }, config.pollIntervalMs);
}

main().catch((error) => {
  logger.error("trade bot crashed", { error: error.message, stack: error.stack });
  process.exitCode = 1;
});

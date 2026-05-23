const { MockSteamAdapter } = require("./adapters/mock-steam-adapter");
const { SteamOfferAdapter } = require("./adapters/steam-offer-adapter");
const { validateDeliveryJob } = require("./trade-offer-policy");

class TradeBotManager {
  constructor(config, orderStore, logger) {
    this.config = config;
    this.orderStore = orderStore;
    this.logger = logger;
    this.adapter = config.dryRun
      ? new MockSteamAdapter(logger)
      : new SteamOfferAdapter(config, logger);
  }

  async start() {
    await this.adapter.connect();
    this.logger.info("trade bot manager started", {
      mode: this.config.mode,
      pollIntervalMs: this.config.pollIntervalMs
    });
  }

  async processOnce() {
    const jobs = this.orderStore.listQueued();
    if (!jobs.length) {
      this.logger.info("no queued trade jobs");
      return;
    }

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  async processJob(job) {
    const validation = validateDeliveryJob(job);
    if (!validation.ok) {
      this.orderStore.updateStatus(job.id, "manual_review", {
        errors: validation.errors
      });
      this.logger.warn("trade job failed policy validation", {
        orderId: job.id,
        errors: validation.errors
      });
      return;
    }

    this.orderStore.updateStatus(job.id, "validated");
    const offer = await this.adapter.sendTradeOffer(job);
    this.orderStore.updateStatus(job.id, "offer_sent", {
      offerId: offer.offerId,
      dryRun: offer.dryRun === true
    });
    this.logger.info("trade offer sent", {
      orderId: job.id,
      offerId: offer.offerId
    });

    const state = await this.adapter.pollOfferState(offer.offerId);
    if (state.state === "accepted") {
      this.orderStore.updateStatus(job.id, "accepted", {
        offerState: state.state
      });
      this.logger.info("trade offer accepted", {
        orderId: job.id,
        offerId: offer.offerId
      });
    }
  }
}

module.exports = { TradeBotManager };

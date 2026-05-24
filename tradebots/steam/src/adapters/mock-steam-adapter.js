class MockSteamAdapter {
  constructor(logger) {
    this.logger = logger;
  }

  async connect() {
    this.logger.info("mock steam adapter connected");
  }

  async sendTradeOffer(job) {
    const offerId = `mock-offer-${Date.now()}`;
    this.logger.info("mock trade offer created", {
      orderId: job.id,
      offerId,
      assetIds: job.assetIds
    });
    return {
      offerId,
      state: "sent",
      dryRun: true
    };
  }

  async pollOfferState(offerId) {
    return {
      offerId,
      state: "accepted",
      dryRun: true
    };
  }
}

module.exports = { MockSteamAdapter };

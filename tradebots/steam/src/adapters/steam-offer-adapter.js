class SteamOfferAdapter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.client = null;
    this.community = null;
    this.manager = null;
  }

  async connect() {
    throw new Error(
      "Live Steam adapter is scaffolded but not enabled. Wire steam-user, steamcommunity, steam-tradeoffer-manager, and Steam Guard confirmation handling before live use."
    );
  }

  async sendTradeOffer() {
    throw new Error("Live trade offer sending is not implemented yet.");
  }

  async pollOfferState() {
    throw new Error("Live trade offer polling is not implemented yet.");
  }
}

module.exports = { SteamOfferAdapter };

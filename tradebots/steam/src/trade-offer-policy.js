function validateDeliveryJob(job) {
  const errors = [];
  if (!job || typeof job !== "object") errors.push("job must be an object");
  if (!job.id) errors.push("order id is required");
  if (!job.listingId) errors.push("listingId is required");
  if (!/^\d{17}$/.test(String(job.buyerSteamId64 || ""))) errors.push("buyerSteamId64 must be a SteamID64");
  if (!String(job.buyerTradeUrl || "").startsWith("https://steamcommunity.com/tradeoffer/new/")) errors.push("buyerTradeUrl must be a Steam trade offer URL");
  if (!Array.isArray(job.assetIds) || job.assetIds.length === 0) errors.push("assetIds must contain at least one asset id");
  if (!job.marketHashName) errors.push("marketHashName is required");
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = { validateDeliveryJob };

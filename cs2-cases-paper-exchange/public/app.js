const api = {
  get: (u) => fetch(u).then((r) => r.json()),
  post: (u, body = {}) =>
    fetch(u, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => r.json())
};

const marketTitleEl = document.getElementById("market-title");
const marketSubtitleEl = document.getElementById("market-subtitle");
const activeCountEl = document.getElementById("active-count");
const floorPriceEl = document.getElementById("floor-price");
const skinsGridEl = document.getElementById("skins-grid");
const selectedNameEl = document.getElementById("selected-name");
const selectedMetaEl = document.getElementById("selected-meta");
const searchInputEl = document.getElementById("search-input");
const minPriceEl = document.getElementById("min-price");
const maxPriceEl = document.getElementById("max-price");
const inventorySearchEl = document.getElementById("inventory-search");
const inventoryGridEl = document.getElementById("inventory-grid");
const inventoryGroupToggleEl = document.getElementById("inventory-group-toggle");
const inventoryTotalEl = document.getElementById("inventory-total");
const typeChipEls = Array.from(document.querySelectorAll(".chip[data-type]"));
const navBtnEls = Array.from(document.querySelectorAll(".nav-btn[data-view]"));
const sortBtnEls = Array.from(document.querySelectorAll(".sort-btn[data-sort]"));
const marketViewEl = document.getElementById("market-view");
const inventoryViewEl = document.getElementById("inventory-view");
const profileViewEl = document.getElementById("profile-view");
const walletStatusEl = document.getElementById("wallet-status");
const connectWalletBtnEl = document.getElementById("connect-wallet-btn");
const walletModalEl = document.getElementById("wallet-modal");
const walletConnectMetaMaskEl = document.getElementById("wallet-connect-metamask");
const tradeModalEl = document.getElementById("trade-modal");
const modalTitleEl = document.getElementById("modal-title");
const modalItemNameEl = document.getElementById("modal-item-name");
const modalItemMetaEl = document.getElementById("modal-item-meta");
const modalQtyEl = document.getElementById("modal-qty");
const modalPriceEl = document.getElementById("modal-price");
const modalConfirmEl = document.getElementById("modal-confirm");
const paymentStatusEl = document.getElementById("payment-status");
const primaryItemActionEl = document.getElementById("primary-item-action");
const secondaryItemActionEl = document.getElementById("secondary-item-action");
const tertiaryItemActionEl = document.getElementById("tertiary-item-action");
const resultsCountEl = document.getElementById("results-count");
const profileSteamIdEl = document.getElementById("profile-steam-id");
const profileSteamNameEl = document.getElementById("profile-steam-name");
const profileTradeLinkEl = document.getElementById("profile-trade-link");
const profileSaveBtnEl = document.getElementById("profile-save-btn");
const profileConnectSteamBtnEl = document.getElementById("profile-connect-steam-btn");
const profileStatusEl = document.getElementById("profile-status");
const profileHeroNameEl = document.getElementById("profile-hero-name");
const profileHeroSubtitleEl = document.getElementById("profile-hero-subtitle");
const profileAvatarEl = document.getElementById("profile-avatar");
const profileWalletStateEl = document.getElementById("profile-wallet-state");
const profileSteamStateEl = document.getElementById("profile-steam-state");
const profileTradeStateEl = document.getElementById("profile-trade-state");
const profileHistoryEl = document.getElementById("profile-history");
const resultsNoteEl = document.getElementById("results-note");
const loadMoreBtnEl = document.getElementById("load-more-btn");
const catalogFooterTextEl = document.getElementById("catalog-footer-text");

let selectedItem = null;
let modalItem = null;
let modalMode = "buy";
let catalogItems = [];
let featuredItems = [];
let featuredByType = {};
let fullCatalogLoaded = false;
let currentType = "all";
let currentView = "market";
let connectedWallet = null;
let currentSort = "popular";
let marketRenderLimit = 48;
let profileState = null;
let currentPurchaseOrder = null;
let steamInventory = [];
let inventoryGrouped = true;
const steamPriceCatalog = new Map();

function persistWallet(address) {
  try {
    if (address) localStorage.setItem("arc_wallet_address", address);
    else localStorage.removeItem("arc_wallet_address");
  } catch {}
}

function loadPersistedWallet() {
  try {
    return localStorage.getItem("arc_wallet_address");
  } catch {
    return null;
  }
}

const INVENTORY_LIMIT = 24;
const MARKET_PAGE_SIZE = 48;

const ARC_NETWORK = {
  chainIdHex: "0x4cef52",
  chainIdDec: 5042002,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: [
    "https://rpc.testnet.arc.network",
    "https://rpc.blockdaemon.testnet.arc.network",
    "https://rpc.drpc.testnet.arc.network",
    "https://rpc.quicknode.testnet.arc.network"
  ],
  blockExplorerUrls: ["https://testnet.arcscan.app"]
};

function isTradeVerified() {
  return Boolean(profileState?.steamId && profileState?.steamTradeLink && Number(profileState?.tradeLinkVerified || 0) === 1);
}

function updateProfileSummary() {
  if (profileHeroNameEl) {
    profileHeroNameEl.textContent = profileState?.steamName || "Steam not connected";
  }
  if (profileHeroSubtitleEl) {
    profileHeroSubtitleEl.textContent = profileState?.steamId ? "Steam connected and ready for trading." : "Connect Steam to unlock inventory sync and trading actions.";
  }
  if (profileAvatarEl) {
    if (profileState?.steamAvatar) {
      profileAvatarEl.innerHTML = `<img src="${profileState.steamAvatar}" alt="Steam avatar" class="profile-avatar-image" />`;
    } else {
      profileAvatarEl.textContent = (profileState?.steamName || "S").slice(0,1).toUpperCase();
    }
  }
  if (profileWalletStateEl) {
    profileWalletStateEl.textContent = connectedWallet ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}` : "Not connected";
  }
  if (profileSteamStateEl) {
    profileSteamStateEl.textContent = profileState?.steamId ? (profileState.steamName || profileState.steamId) : "Not connected";
  }
  if (profileTradeStateEl) {
    profileTradeStateEl.textContent = isTradeVerified() ? "Verified" : "Not verified";
  }
  if (profileStatusEl) {
    profileStatusEl.textContent = isTradeVerified()
      ? "Steam profile verified. Trading is unlocked."
      : profileState?.steamId
        ? "Steam connected. Add a valid trade link to unlock trading."
        : "Steam profile not verified. Buying and selling are blocked.";
    profileStatusEl.classList.toggle("verified", isTradeVerified());
  }
}

async function loadSteamInventory() {
  if (!profileState?.steamId) {
    steamInventory = [];
    return;
  }
  steamInventory = await api.get("/api/steam/inventory").catch(() => []);
}

async function loadProfile(options = {}) {
  const { withInventory = false, withHistory = true } = options;
  profileState = await api.get("/api/profile").catch(() => null);
  if (profileState?.steamId && !profileState?.steamName) {
    profileState.steamName = `Steam ${profileState.steamId.slice(-6)}`;
  }
  if (profileSteamIdEl) profileSteamIdEl.value = profileState?.steamId || "";
  if (profileSteamNameEl) profileSteamNameEl.value = profileState?.steamName || "";
  if (profileTradeLinkEl) profileTradeLinkEl.value = profileState?.steamTradeLink || "";
  if (withInventory) {
    await loadSteamInventory();
  }
  if (withHistory && profileHistoryEl) {
    const orders = await api.get("/api/orders?limit=8").catch(() => []);
    profileHistoryEl.innerHTML = orders.length
      ? orders.map((order) => `${order.symbol} · ${order.side} · ${fmt(order.price)} USDC · ${order.status}`).join("<br />")
      : "No purchase/sale history yet.";
  }
  updateProfileSummary();
}

async function saveProfile() {
  const steamId = (profileSteamIdEl?.value?.trim() || profileState?.steamId || "");
  const steamName = (profileSteamNameEl?.value?.trim() || profileState?.steamName || "");
  const steamTradeLink = profileTradeLinkEl?.value?.trim();

  if (!steamId || !steamName) {
    alert("Connect Steam first.");
    return;
  }
  if (!steamTradeLink) {
    alert("Fill Steam trade link first.");
    return;
  }

  const result = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steamId, steamName, steamTradeLink })
  });

  const data = await result.json();
  if (!result.ok) {
    alert(data.error || "Could not save profile");
    return;
  }

  profileState = data;
  updateProfileSummary();
}

function ensureTradingUnlocked() {
  if (!connectedWallet) {
    alert("Connect ARC wallet first.");
    openWalletModal();
    return false;
  }
  if (!isTradeVerified()) {
    alert("Complete Profile and verify your Steam trade link before buying or selling.");
    switchView("profile");
    return false;
  }
  return true;
}

function fmt(n) {
  const x = Number(n ?? 0);
  return Number.isFinite(x)
    ? x.toLocaleString("en-US", { minimumFractionDigits: x < 10 ? 2 : 0, maximumFractionDigits: 2 })
    : "0";
}

function cardAccent(tag) {
  if (tag === "knife") return "#ffb4c8";
  if (tag === "gloves") return "#ff7ab6";
  if (tag === "case") return "#ff9fc6";
  if (tag === "sticker") return "#c7a2ff";
  return "#ff8fb1";
}

function labelForType(type) {
  return {
    skin: "Skin",
    knife: "Knife",
    gloves: "Gloves",
    case: "Case",
    sticker: "Sticker"
  }[type] || "Item";
}

function fallbackImage(item) {
  const t = item.type;
  if (t === "knife") return "/images/cs2-butterfly-fade.svg";
  if (item.weapon?.includes("AWP")) return "/images/cs2-awp-asiimov.svg";
  if (item.weapon?.includes("M4")) return "/images/cs2-printstream.svg";
  return "/images/cs2-ak-redline.svg";
}

function imageClassForItem(item) {
  if (item.type === "case") return "case-art";
  if (item.type === "sticker") return "sticker-art";
  if (item.type === "knife") return "knife-art";
  if (item.type === "gloves") return "gloves-art";
  return "weapon-art";
}

function rarityBadge(item) {
  const rarityName = item.rarity?.name || "Unspecified";
  const rarityColor = item.rarity?.color || "#ff8fb1";
  return `<span class="rarity-pill" style="--rarity-color:${rarityColor}">${rarityName}</span>`;
}

function itemKey(item) {
  return `${item.id || item.marketHashName || item.name}`;
}

function visibleMarketSlice(items) {
  if (!items.length) return [];
  return items.slice(0, Math.min(marketRenderLimit, items.length));
}

async function ensureSteamPricesForItems(items) {
  const uniqueNames = Array.from(new Set((items || []).map((item) => item.marketHashName || item.name).filter(Boolean)));
  const missing = uniqueNames.filter((name) => !steamPriceCatalog.has(name));
  const batch = missing.slice(0, 120);
  await Promise.all(batch.map(async (marketHashName) => {
    try {
      const data = await api.get(`/api/steam/price?marketHashName=${encodeURIComponent(marketHashName)}`);
      steamPriceCatalog.set(marketHashName, data);
    } catch {
      steamPriceCatalog.set(marketHashName, { marketHashName, steamPrice: "—", priceUsdc: 0 });
    }
  }));
}

function parseSteamPriceValue(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const match = cleaned.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function attachSteamPrices(items) {
  return (items || []).map((item) => {
    const key = item.marketHashName || item.name;
    const steam = steamPriceCatalog.get(key);
    if (!steam) return item;
    return { ...item, steamPrice: steam.steamPrice, priceUsdc: steam.priceUsdc || parseSteamPriceValue(steam.steamPrice) || item.priceUsdc || 0 };
  });
}

async function loadFeaturedCatalog() {
  const [featuredRes, byTypeRes] = await Promise.all([
    fetch("/data/storefront-featured.json", { cache: "no-store" }),
    fetch("/data/storefront-by-type.json", { cache: "no-store" })
  ]);

  featuredItems = await featuredRes.json();
  featuredByType = await byTypeRes.json();

  if (!catalogItems.length) {
    catalogItems = [...featuredItems];
  }
}

async function ensureFullCatalog() {
  if (fullCatalogLoaded) return;
  const res = await fetch("/data/items.json", { cache: "no-store" });
  catalogItems = await res.json();
  fullCatalogLoaded = true;
}

async function refreshAccount() {
  const acc = await api.get("/api/account").catch(() => null);
  if (!acc) {
    document.getElementById("account-summary").innerHTML = "Demo account unavailable";
    return;
  }
  document.getElementById("account-summary").innerHTML = `
    Balance <b>${fmt(acc.balance)}</b><br />
    Available <b>${fmt(acc.freeMargin)}</b><br />
    Equity <b>${fmt(acc.equity)}</b>
  `;
}

function popularityScore(item) {
  const rarityBoost = {
    Contraband: 120,
    Covert: 90,
    Extraordinary: 80,
    Classified: 65,
    Remarkable: 55,
    Restricted: 45,
    Industrial: 12,
    MilSpec: 30,
    "High Grade": 18,
    "Base Grade": 10,
    Container: 24,
    Exotic: 60,
    Superior: 40,
    Distinguished: 28
  }[item.rarity?.name] || 20;

  const typeBoost = {
    knife: 90,
    gloves: 80,
    skin: 40,
    case: 22,
    sticker: 18
  }[item.type] || 10;

  return Number(item.priceUsdc || 0) + rarityBoost + typeBoost;
}

function sortItems(items) {
  const next = [...items];

  if (currentSort === "price-asc") {
    return next.sort((a, b) => Number(a.priceUsdc || 0) - Number(b.priceUsdc || 0) || a.name.localeCompare(b.name));
  }
  if (currentSort === "price-desc") {
    return next.sort((a, b) => Number(b.priceUsdc || 0) - Number(a.priceUsdc || 0) || a.name.localeCompare(b.name));
  }
  if (currentSort === "name") {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }

  return next.sort((a, b) => popularityScore(b) - popularityScore(a) || a.name.localeCompare(b.name));
}

function activeCatalogSource() {
  if (fullCatalogLoaded) return catalogItems;
  if (currentType !== "all" && featuredByType[currentType]?.length) return featuredByType[currentType];
  return featuredItems;
}

function needsFullCatalog() {
  const q = (searchInputEl?.value || "").trim();
  const minPrice = Number(minPriceEl?.value || 0);
  const maxPrice = Number(maxPriceEl?.value || 0);
  return Boolean(q) || minPrice > 0 || (Number.isFinite(maxPrice) && maxPrice > 0 && maxPrice < 5000) || marketRenderLimit > MARKET_PAGE_SIZE;
}

function filteredItems() {
  const q = (searchInputEl?.value || "").trim().toLowerCase();
  const minPrice = Number(minPriceEl?.value || 0);
  const maxPriceRaw = Number(maxPriceEl?.value || 0);
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : Number.POSITIVE_INFINITY;
  const source = activeCatalogSource();

  return sortItems(
    source.filter((item) => {
      if (currentType !== "all" && item.type !== currentType) return false;
      const price = Number(item.priceUsdc ?? 0);
      if (price < minPrice || price > maxPrice) return false;
      if (!q) return true;
      const hay = `${item.name} ${item.type} ${item.weapon} ${item.wear} ${item.category} ${item.pattern || ""}`.toLowerCase();
      return hay.includes(q);
    })
  );
}

function inventoryItems() {
  const q = (inventorySearchEl?.value || "").trim().toLowerCase();
  const source = Array.isArray(steamInventory) && steamInventory.length ? steamInventory.filter((item) => item.tradable !== false) : [];
  let items = source;

  if (inventoryGrouped) {
    const grouped = [];
    const caseGroups = new Map();

    for (const item of source) {
      if (item.type === "case") {
        const key = item.marketHashName || item.name;
        if (!caseGroups.has(key)) {
          caseGroups.set(key, { ...item, quantity: 1, groupedIds: [item.id] });
        } else {
          const current = caseGroups.get(key);
          current.quantity += 1;
          current.groupedIds.push(item.id);
        }
        continue;
      }
      grouped.push(item);
    }

    items = [...grouped, ...Array.from(caseGroups.values()).map((item) => ({ ...item, name: `${item.name} ×${item.quantity}` }))];
  }

  return items.filter((item) => {
    if (!q) return true;
    return `${item.name} ${item.weapon} ${item.type} ${item.inventoryStatus}`.toLowerCase().includes(q);
  });
}

function updateHero(items, renderedCount) {
  marketTitleEl.textContent = "CS2 skins marketplace";
  marketSubtitleEl.textContent = "Search-first storefront for CS2 items with demo listings, offer flow, and ARC-ready settlement UX.";
  activeCountEl.textContent = String(items.length);
  const floor = items.length ? Math.min(...items.map((x) => Number(x.priceUsdc))) : 0;
  floorPriceEl.textContent = items.length ? `${fmt(floor)} USDC` : "—";
  if (resultsCountEl) resultsCountEl.textContent = `${items.length.toLocaleString("en-US")} results`;
  if (resultsNoteEl) {
    const prefix = fullCatalogLoaded ? "Full catalog" : "Fast start";
    resultsNoteEl.textContent = items.length > renderedCount
      ? `${prefix}: showing ${renderedCount} items so far`
      : `${prefix}: showing all filtered items`;
  }
  if (catalogFooterTextEl) {
    catalogFooterTextEl.textContent = items.length > renderedCount
      ? `Displaying ${renderedCount} of ${items.length.toLocaleString("en-US")} filtered items. Use Load more to continue through the full catalog.`
      : `Displaying all ${renderedCount.toLocaleString("en-US")} filtered items.`;
  }
  if (loadMoreBtnEl) {
    loadMoreBtnEl.classList.toggle("hidden-view", items.length <= renderedCount);
  }
}

function marketActions(item) {
  return `
    <button class="buy-btn" data-action="buy" data-id="${item.id}">Buy now</button>
    <button class="offer-btn" data-action="offer" data-id="${item.id}">Make offer</button>
  `;
}

function inventoryActions(item) {
  if (item.inventoryStatus === "listed") {
    return `
      <button class="buy-btn" data-action="delist" data-id="${item.id}">Delist</button>
      <button class="offer-btn" data-action="details" data-id="${item.id}">Details</button>
    `;
  }
  if (item.inventoryStatus === "in escrow") {
    return `
      <button class="buy-btn" data-action="status" data-id="${item.id}">View status</button>
      <button class="offer-btn" data-action="details" data-id="${item.id}">Details</button>
    `;
  }
  return `
    <button class="buy-btn" data-action="list" data-id="${item.id}">List item</button>
    <button class="offer-btn" data-action="withdraw" data-id="${item.id}">Withdraw</button>
    <button class="offer-btn" data-action="details" data-id="${item.id}">Details</button>
  `;
}

function itemCardHtml(item, context = "market") {
  const owned = context === "inventory";
  const sellerLine = owned
    ? `Status: ${item.inventoryStatus || "in inventory"}`
    : `${item.wear} · Seller: ${item.seller}`;
  const actions = owned ? inventoryActions(item) : marketActions(item);
  const imageClass = imageClassForItem(item);
  const rarityColor = item?.rarity?.color || cardAccent(item.type);

  return `
    <article class="skin-card overlay-card" style="--card-rarity:${rarityColor}" data-item-id="${item.id}" data-context="${context}">
      <div class="skin-thumb skin-thumb--${item.type}" style="background: radial-gradient(circle at top, ${rarityColor}44, transparent 45%), linear-gradient(180deg, color-mix(in srgb, ${rarityColor} 18%, #1c2129 82%), #131820);">
        <img src="${item.image || fallbackImage(item)}" alt="${item.name}" class="skin-thumb-image ${imageClass}" loading="lazy" referrerpolicy="no-referrer" decoding="async" />
        <div class="card-overlay"></div>
        <div class="card-info-overlay">
          <div class="skin-mini-meta">${item.wear || "—"}${owned ? ` · ${item.quantity ? `${item.quantity} items` : "Owned"}` : ""}</div>
          <div class="skin-price">${item.steamPrice && item.steamPrice !== "—" ? item.steamPrice : (item.priceUsdc ? `${fmt(item.priceUsdc)} USD` : "Price unavailable")}</div>
          <div class="skin-name overlay-name">${item.name}</div>
        </div>
        ${!owned ? `<button class="hover-buy-btn" data-action="buy" data-id="${item.id}">Buy now</button>` : `<button class="hover-buy-btn inventory-hover-btn" data-action="list" data-id="${item.id}">List item</button>`}
      </div>
    </article>
  `;
}

function bindItemCards(root, items) {
  for (const el of root.querySelectorAll(".skin-card")) {
    el.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      const id = el.getAttribute("data-item-id");
      const item = items.find((x) => String(x.id) === String(id));
      if (!item) return;
      selectedItem = item;
      renderSelectedItem();
    });
  }

  for (const btn of root.querySelectorAll("button[data-action]")) {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = btn.getAttribute("data-id");
      const item = items.find((x) => String(x.id) === String(id));
      if (!item) return;
      selectedItem = item;
      renderSelectedItem();
      openTradeModal(btn.getAttribute("data-action"), item);
    });
  }
}

function renderListings(items) {
  const visibleItems = visibleMarketSlice(attachSteamPrices(items));

  if (!visibleItems.length) {
    skinsGridEl.innerHTML = `
      <div class="empty-state panel">
        <div class="selected-name">No items match the current filters</div>
        <div class="selected-meta">Try clearing search, widening the price range, or switching the item type.</div>
      </div>
    `;
    return [];
  }

  skinsGridEl.innerHTML = visibleItems.map((item) => itemCardHtml(item, "market")).join("");
  bindItemCards(skinsGridEl, visibleItems);
  return visibleItems;
}

function renderInventory() {
  const items = attachSteamPrices(inventoryItems());
  if (inventoryGroupToggleEl) {
    inventoryGroupToggleEl.textContent = `Grouped: ${inventoryGrouped ? "ON" : "OFF"}`;
  }
  if (inventoryTotalEl) {
    const total = items.reduce((sum, item) => sum + ((Number(item.priceUsdc || 0) || parseSteamPriceValue(item.steamPrice)) * Number(item.quantity || 1)), 0);
    inventoryTotalEl.textContent = `Inventory value: ${total > 0 ? `${fmt(total)} USD` : "—"}`;
  }
  inventoryGridEl.innerHTML = items.map((item) => itemCardHtml(item, "inventory")).join("");
  bindItemCards(inventoryGridEl, items);
  return items;
}

function renderSelectedItem() {
  if (!selectedItem) {
    selectedNameEl.textContent = "Select an item";
    selectedMetaEl.innerHTML = "Price, category, seller, and listing status";
    primaryItemActionEl.textContent = "Buy now";
    secondaryItemActionEl.textContent = "Make offer";
    tertiaryItemActionEl.textContent = "View details";
    return;
  }

  const sellerOrStatus = currentView === "inventory"
    ? `Status: ${selectedItem.inventoryStatus || "in inventory"}`
    : `Seller: ${selectedItem.seller} · Escrow: ready`;

  selectedNameEl.textContent = selectedItem.name;
  selectedMetaEl.innerHTML = `
    Steam price: ${selectedItem.steamPrice || "—"} · Market price: ${selectedItem.marketPrice || "—"}<br />
    ${labelForType(selectedItem.type)} · ${selectedItem.weapon} · ${selectedItem.wear}<br />
    Category: ${selectedItem.category || "Item"} · ${selectedItem.pattern || "No pattern"}<br />
    ${selectedItem.quantity ? `Quantity: ${selectedItem.quantity}<br />` : ""}
    ${sellerOrStatus}<br />
    ${rarityBadge(selectedItem)}
  `;

  if (currentView === "inventory") {
    if (selectedItem.inventoryStatus === "listed") {
      primaryItemActionEl.textContent = "Delist";
      secondaryItemActionEl.textContent = "Details";
      tertiaryItemActionEl.textContent = "View listing";
    } else if (selectedItem.inventoryStatus === "in escrow") {
      primaryItemActionEl.textContent = "View status";
      secondaryItemActionEl.textContent = "Details";
      tertiaryItemActionEl.textContent = "Support notes";
    } else {
      primaryItemActionEl.textContent = "List item";
      secondaryItemActionEl.textContent = "Withdraw";
      tertiaryItemActionEl.textContent = "Details";
    }
  } else {
    primaryItemActionEl.textContent = "Buy now";
    secondaryItemActionEl.textContent = "Make offer";
    tertiaryItemActionEl.textContent = "View details";
  }
}

function openTradeModal(mode, item) {
  tradeModalEl.hidden = false;
  currentPurchaseOrder = null;
  if (paymentStatusEl) paymentStatusEl.textContent = "No payment created yet.";
  const tradingModes = ["buy", "offer", "list", "delist", "withdraw"];
  if (tradingModes.includes(mode) && !ensureTradingUnlocked()) {
    return;
  }

  modalMode = mode;
  modalItem = item;

  const titleMap = {
    buy: "Buy item",
    offer: "Make offer",
    list: "Create listing",
    delist: "Remove listing",
    withdraw: "Withdraw item",
    status: "Escrow status",
    details: "Item details"
  };

  const confirmMap = {
    buy: "Confirm purchase",
    offer: "Send offer",
    list: "Create listing",
    delist: "Confirm delist",
    withdraw: "Start withdrawal",
    status: "Close",
    details: "Close"
  };

  modalTitleEl.textContent = titleMap[mode] || "Item action";
  modalItemNameEl.textContent = item.name;
  modalItemMetaEl.innerHTML = `${labelForType(item.type)} · ${item.weapon}<br />${item.wear} · ${fmt(item.priceUsdc)} USDC<br />Category: ${item.category || "Item"}`;

  const readonlyMode = ["status", "details"].includes(mode);
  const hiddenQtyMode = ["status", "details", "withdraw", "delist"].includes(mode);
  modalQtyEl.closest("label")?.classList.toggle("hidden-view", hiddenQtyMode);
  modalPriceEl.closest("label")?.classList.toggle("hidden-view", readonlyMode || mode === "status");
  modalQtyEl.value = 1;
  modalPriceEl.value = Number(item.priceUsdc).toFixed(2);
  modalPriceEl.readOnly = readonlyMode;
  modalConfirmEl.textContent = confirmMap[mode] || "Confirm";
  tradeModalEl.classList.remove("hidden-view");
}

function closeTradeModal() {
  tradeModalEl.classList.add("hidden-view");
  tradeModalEl.hidden = true;
  modalItem = null;
}

function openWalletModal() {
  walletModalEl.hidden = false;
  walletModalEl.classList.remove("hidden-view");
}

function closeWalletModal() {
  walletModalEl.classList.add("hidden-view");
  walletModalEl.hidden = true;
}

function setWalletStatus(text, connected = false) {
  walletStatusEl.textContent = text;
  walletStatusEl.classList.toggle("connected", connected);
}

async function connectArcWallet() {
  if (!window.ethereum) {
    alert("No EVM wallet found. Open this page in MetaMask or another compatible wallet.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts?.[0];
    if (!address) throw new Error("Wallet did not return an address");

    connectedWallet = address;
    persistWallet(address);
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (chainId?.toLowerCase() === ARC_NETWORK.chainIdHex) {
      setWalletStatus(`ARC: ${address.slice(0, 6)}...${address.slice(-4)}`, true);
      connectWalletBtnEl.textContent = "ARC Wallet connected";
      updateProfileSummary();
      closeWalletModal();
      return;
    }

    setWalletStatus(`Wallet ${address.slice(0, 6)}...${address.slice(-4)} connected, but network is not ARC`, false);
    const shouldSwitch = confirm("Wallet connected, but ARC Testnet is not selected. Try switching network?");
    if (!shouldSwitch) {
      closeWalletModal();
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_NETWORK.chainIdHex }]
      });
    } catch (_switchError) {
      const shouldAdd = confirm("ARC Testnet is not available in this wallet. Try adding it manually?");
      if (!shouldAdd) {
        closeWalletModal();
        return;
      }
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ARC_NETWORK.chainIdHex,
          chainName: ARC_NETWORK.chainName,
          nativeCurrency: ARC_NETWORK.nativeCurrency,
          rpcUrls: ARC_NETWORK.rpcUrls,
          blockExplorerUrls: ARC_NETWORK.blockExplorerUrls
        }]
      });
    }

    const updatedChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (updatedChainId?.toLowerCase() === ARC_NETWORK.chainIdHex) {
      setWalletStatus(`ARC: ${address.slice(0, 6)}...${address.slice(-4)}`, true);
      connectWalletBtnEl.textContent = "ARC Wallet connected";
      updateProfileSummary();
    } else {
      setWalletStatus("Wallet connected, network is still not ARC", false);
    }

    closeWalletModal();
  } catch (error) {
    alert(`Could not connect wallet: ${error.message || error}`);
  }
}

function switchView(view) {
  currentView = view;
  navBtnEls.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));

  [marketViewEl, inventoryViewEl, profileViewEl].filter(Boolean).forEach((el) => {
    el.classList.add("hidden-view");
    el.hidden = true;
  });

  if (view === "inventory") {
    inventoryViewEl.hidden = false;
    inventoryViewEl.classList.remove("hidden-view");
    renderInventory();
  } else if (view === "profile") {
    profileViewEl.hidden = false;
    profileViewEl.classList.remove("hidden-view");
    loadProfile({ withInventory: false, withHistory: true });
  } else {
    marketViewEl.hidden = false;
    marketViewEl.classList.remove("hidden-view");
  }

  renderSelectedItem();
}

async function refreshCatalog(resetLimit = false) {
  if (resetLimit) {
    marketRenderLimit = MARKET_PAGE_SIZE;
  }

  if (needsFullCatalog()) {
    await ensureFullCatalog();
  }

  const items = filteredItems();
  const visibleItems = renderListings(items);
  const inventoryList = renderInventory();
  updateHero(items, visibleItems.length);

  const availableIds = new Set([...visibleItems, ...inventoryList].map((item) => String(item.id)));
  if (!selectedItem || !availableIds.has(String(selectedItem.id))) {
    selectedItem = visibleItems[0] ?? inventoryList[0] ?? null;
  }

  renderSelectedItem();
}

function bindDetailActions() {
  primaryItemActionEl?.addEventListener("click", () => {
    if (!selectedItem) return;
    if (currentView === "inventory") {
      const action = selectedItem.inventoryStatus === "listed"
        ? "delist"
        : selectedItem.inventoryStatus === "in escrow"
          ? "status"
          : "list";
      openTradeModal(action, selectedItem);
      return;
    }
    openTradeModal("buy", selectedItem);
  });

  secondaryItemActionEl?.addEventListener("click", () => {
    if (!selectedItem) return;
    if (currentView === "inventory") {
      const action = selectedItem.inventoryStatus === "in inventory" ? "withdraw" : "details";
      openTradeModal(action, selectedItem);
      return;
    }
    openTradeModal("offer", selectedItem);
  });

  tertiaryItemActionEl?.addEventListener("click", () => {
    if (!selectedItem) return;
    openTradeModal("details", selectedItem);
  });
}

searchInputEl?.addEventListener("input", () => refreshCatalog(true));
minPriceEl?.addEventListener("input", () => refreshCatalog(true));
maxPriceEl?.addEventListener("input", () => refreshCatalog(true));
inventorySearchEl?.addEventListener("input", renderInventory);
navBtnEls.forEach((btn) => {
  if (btn.dataset.view === "inventory") {
    btn.addEventListener("click", async () => {
      if (!steamInventory.length && profileState?.steamId) {
        inventoryGridEl.innerHTML = '<div class="empty-state panel">Loading Steam inventory...</div>';
        await loadSteamInventory();
        await ensureSteamPricesForItems(steamInventory);
        renderInventory();
      }
    });
  }
});
inventoryGroupToggleEl?.addEventListener("click", () => {
  inventoryGrouped = !inventoryGrouped;
  renderInventory();
});
connectWalletBtnEl?.addEventListener("click", openWalletModal);
walletConnectMetaMaskEl?.addEventListener("click", connectArcWallet);
loadMoreBtnEl?.addEventListener("click", async () => {
  marketRenderLimit = marketRenderLimit + MARKET_PAGE_SIZE;
  await refreshCatalog(false);
});
modalConfirmEl?.addEventListener("click", async () => {
  if (!modalItem) return;
  if (["buy", "offer", "list", "delist", "withdraw"].includes(modalMode) && !ensureTradingUnlocked()) return;

  if (modalMode === "buy") {
    if (!connectedWallet) {
      alert("Connect ARC wallet first.");
      return;
    }

    const createRes = await fetch("/api/purchase/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: String(modalItem.id),
        itemName: modalItem.name,
        amountUsdc: Number(modalItem.priceUsdc),
        buyerWallet: connectedWallet
      })
    });
    const order = await createRes.json();
    if (!createRes.ok) {
      alert(order.error || "Could not create purchase order");
      return;
    }

    currentPurchaseOrder = order;
    if (paymentStatusEl) {
      paymentStatusEl.innerHTML = `Order #${order.id} created.<br />Send ${fmt(order.amountUsdc)} USDC to ${order.recipientAddress}.<br />Then paste tx hash.`;
    }

    const txHash = prompt(`Send ${fmt(order.amountUsdc)} USDC to ${order.recipientAddress} on ARC Testnet, then paste the tx hash here:`);
    if (!txHash) return;

    const confirmRes = await fetch("/api/purchase/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, txHash })
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      alert(confirmData.error || "Could not confirm payment");
      return;
    }

    if (paymentStatusEl) {
      paymentStatusEl.innerHTML = `Payment submitted.<br />Order #${confirmData.order.id} status: ${confirmData.order.status}.<br />Tx: ${confirmData.order.txHash}`;
    }
    return;
  }

  const actionLabel = {
    offer: "Offer",
    list: "Listing",
    delist: "Delist",
    withdraw: "Withdrawal",
    status: "Status view",
    details: "Details view"
  }[modalMode] || "Action";
  alert(`${actionLabel} completed in demo mode for ${modalItem.name}`);
  closeTradeModal();
});

for (const closer of document.querySelectorAll("[data-close-modal]")) {
  closer.addEventListener("click", closeTradeModal);
}
for (const closer of document.querySelectorAll("[data-close-wallet]")) {
  closer.addEventListener("click", closeWalletModal);
}

for (const btn of navBtnEls) {
  btn.addEventListener("click", () => switchView(btn.dataset.view || "market"));
}

for (const chip of typeChipEls) {
  chip.addEventListener("click", async () => {
    currentType = chip.dataset.type || "all";
    typeChipEls.forEach((x) => x.classList.remove("active"));
    chip.classList.add("active");
    await refreshCatalog(true);
  });
}

for (const btn of sortBtnEls) {
  btn.addEventListener("click", async () => {
    currentSort = btn.dataset.sort || "popular";
    sortBtnEls.forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    await refreshCatalog(true);
  });
}

profileSaveBtnEl?.addEventListener("click", saveProfile);
profileConnectSteamBtnEl?.addEventListener("click", () => {
  if (connectedWallet) persistWallet(connectedWallet);
  window.location.href = "/auth/steam";
});

const restoredWallet = loadPersistedWallet();
if (restoredWallet) {
  connectedWallet = restoredWallet;
  setWalletStatus(`ARC: ${restoredWallet.slice(0, 6)}...${restoredWallet.slice(-4)}`, true);
  connectWalletBtnEl.textContent = "ARC Wallet connected";
}

marketViewEl.classList.add("hidden-view");
marketViewEl.hidden = true;
inventoryViewEl.classList.add("hidden-view");
inventoryViewEl.hidden = true;
profileViewEl?.classList.add("hidden-view");
if (profileViewEl) profileViewEl.hidden = true;
closeTradeModal();
closeWalletModal();

bindDetailActions();
await loadFeaturedCatalog();
await refreshAccount();
await loadProfile({ withInventory: false, withHistory: false });
await ensureSteamPricesForItems(catalogItems);
await refreshCatalog(true);
updateProfileSummary();
switchView(window.location.hash === "#profile-view" ? "profile" : "market");

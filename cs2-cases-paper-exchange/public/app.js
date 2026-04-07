const api = {
  get: (u) => fetch(u).then((r) => r.json()),
  post: (u, body = {}) =>
    fetch(u, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => r.json())
};

const sideEl = document.getElementById("side");
const sizeEl = document.getElementById("size");
const leverageEl = document.getElementById("leverage");
const submitOrderEl = document.getElementById("submit-order");
const marketTitleEl = document.getElementById("market-title");
const marketSubtitleEl = document.getElementById("market-subtitle");
const activeCountEl = document.getElementById("active-count");
const floorPriceEl = document.getElementById("floor-price");
const skinsGridEl = document.getElementById("skins-grid");
const selectedNameEl = document.getElementById("selected-name");
const selectedMetaEl = document.getElementById("selected-meta");
const searchInputEl = document.getElementById("search-input");
const typeChipEls = Array.from(document.querySelectorAll(".chip[data-type]"));

let selectedItem = null;
let catalogItems = [];
let currentType = "all";

function fmt(n) {
  const x = Number(n ?? 0);
  return Number.isFinite(x)
    ? x.toLocaleString("ru-RU", { minimumFractionDigits: x < 10 ? 2 : 0, maximumFractionDigits: 2 })
    : "0";
}

function cardAccent(tag) {
  if (tag === "knife") return "#ffb347";
  if (tag === "gloves") return "#ff7aa2";
  if (tag === "case") return "#7ed957";
  if (tag === "sticker") return "#8b7bff";
  return "#4da3ff";
}

function labelForType(type) {
  return {
    skin: "Скин",
    knife: "Нож",
    gloves: "Перчатки",
    case: "Кейс",
    sticker: "Стикер"
  }[type] || "Предмет";
}

function fallbackImage(item) {
  const t = item.type;
  if (t === "knife") return "/images/cs2-butterfly-fade.svg";
  if (item.weapon?.includes("AWP")) return "/images/cs2-awp-asiimov.svg";
  if (item.weapon?.includes("M4")) return "/images/cs2-printstream.svg";
  return "/images/cs2-ak-redline.svg";
}

async function loadCatalog() {
  const res = await fetch("/data/items.json", { cache: "no-store" });
  catalogItems = await res.json();
}

async function refreshAccount() {
  const acc = await api.get("/api/account");
  document.getElementById("account-summary").innerHTML = `
    Баланс <b>${fmt(acc.balance)}</b><br />
    Free <b>${fmt(acc.freeMargin)}</b><br />
    Equity <b>${fmt(acc.equity)}</b>
  `;
}

function priorityScore(item) {
  if (item.type === "skin") return 0;
  if (item.type === "case") return 1;
  if (item.type === "knife") return 2;
  if (item.type === "gloves") return 3;
  return 4;
}

function filteredItems() {
  const q = (searchInputEl?.value || "").trim().toLowerCase();
  return catalogItems
    .filter((item) => {
      if (currentType !== "all" && item.type !== currentType) return false;
      if (!q) return true;
      const hay = `${item.name} ${item.type} ${item.weapon} ${item.wear}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      const pa = priorityScore(a);
      const pb = priorityScore(b);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
}

function updateHero(items) {
  marketTitleEl.textContent = "Маркет скинов CS2";
  marketSubtitleEl.textContent = "Локальный демо-каталог до запуска майнета ARC: поиск по предметам, картинки, ориентировочные цены и будущий P2P-листинг.";
  activeCountEl.textContent = String(items.length);
  const floor = items.length ? Math.min(...items.map((x) => Number(x.priceUsdc))) : 0;
  floorPriceEl.textContent = items.length ? `${fmt(floor)} USDC` : "—";
}

function renderListings(items) {
  skinsGridEl.innerHTML = items
    .map(
      (item) => `
        <article class="skin-card" data-item-id="${item.id}">
          <div class="skin-thumb" style="background: radial-gradient(circle at top, ${cardAccent(item.type)}55, transparent 45%), linear-gradient(135deg, #233149, #151b25);">
            <img src="${item.image || fallbackImage(item)}" alt="${item.name}" class="skin-thumb-image ${item.type === 'skin' ? 'weapon-art' : item.type === 'case' ? 'case-art' : ''}" loading="lazy" referrerpolicy="no-referrer" />
          </div>
          <div class="skin-body">
            <div class="skin-name">${item.name}</div>
            <div class="skin-meta">
              ${labelForType(item.type)} · ${item.weapon}<br />
              ${item.wear} · Продавец: ${item.seller}
            </div>
            <div class="skin-price-row">
              <div class="skin-price">${fmt(item.priceUsdc)} USDC</div>
              <div class="skin-tag">${labelForType(item.type)}</div>
            </div>
            <div class="skin-actions">
              <button class="buy-btn" data-buy-id="${item.id}">Купить</button>
              <button class="offer-btn" data-offer-id="${item.id}">Оффер</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  for (const el of skinsGridEl.querySelectorAll(".skin-card")) {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-item-id");
      const item = items.find((x) => x.id === id);
      if (!item) return;
      selectedItem = item;
      renderSelectedItem();
    });
  }
}

function renderSelectedItem() {
  if (!selectedItem) {
    selectedNameEl.textContent = "Выбери предмет";
    selectedMetaEl.textContent = "Цена, тип, продавец, статус escrow";
    return;
  }

  selectedNameEl.textContent = selectedItem.name;
  selectedMetaEl.innerHTML = `
    ${fmt(selectedItem.priceUsdc)} USDC · ${labelForType(selectedItem.type)}<br />
    ${selectedItem.weapon} · ${selectedItem.wear}<br />
    Продавец: ${selectedItem.seller} · Escrow: ready
  `;
  leverageEl.value = String(Number(selectedItem.priceUsdc).toFixed(2));
}

async function refreshServiceTable() {
  const rows = await api.get(`/api/prices/CASE_CS2_WEAPON_CASE?limit=20`).catch(() => []);
  const tbody = document.querySelector("#prices-table tbody");
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${new Date(r.ts).toLocaleTimeString()}</td>
        <td>${Number(r.price).toFixed(2)}</td>
        <td>${Number(r.volume).toFixed(2)}</td>
      </tr>`
    )
    .join("");
}

async function refreshOrders() {
  const rows = await api.get("/api/orders?limit=20");
  const tbody = document.querySelector("#orders-table tbody");
  tbody.innerHTML = rows
    .map(
      (o) => `<tr>
        <td>${new Date(o.created_at).toLocaleTimeString()}</td>
        <td>${selectedItem?.name ?? o.symbol}</td>
        <td>${o.side === "long" ? "Покупка" : "Оффер"}</td>
        <td>${Number(o.size).toFixed(0)}</td>
        <td>${fmt(o.price)}</td>
        <td class="${o.status === "filled" ? "status-filled" : "status-rejected"}">${o.status}</td>
        <td>${o.reason ?? "—"}</td>
      </tr>`
    )
    .join("");
}

async function submitOrder() {
  const targetSymbol = "CASE_CS2_WEAPON_CASE";
  const body = {
    symbol: targetSymbol,
    side: sideEl.value,
    size: Number(sizeEl.value),
    leverage: Number(leverageEl.value),
    type: "market"
  };

  const r = await api.post("/api/orders", body);
  if (!r.ok && r.error) alert(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
  if (!r.ok && r.reason) alert(r.reason);
  await refreshAll();
}

async function refreshCatalog() {
  const items = filteredItems();
  updateHero(items);
  renderListings(items);
  if (!selectedItem || !items.find((x) => x.id === selectedItem.id)) {
    selectedItem = items[0] ?? null;
  }
  renderSelectedItem();
}

async function refreshAll() {
  await Promise.all([refreshAccount(), refreshCatalog(), refreshOrders(), refreshServiceTable()]);
}

submitOrderEl.addEventListener("click", submitOrder);
searchInputEl?.addEventListener("input", refreshCatalog);

for (const chip of typeChipEls) {
  chip.addEventListener("click", async () => {
    currentType = chip.dataset.type || "all";
    typeChipEls.forEach((x) => x.classList.remove("active"));
    chip.classList.add("active");
    await refreshCatalog();
  });
}

document.getElementById("tick-up").addEventListener("click", async () => {
  await api.post("/api/sim/tick", { symbol: "CASE_CS2_WEAPON_CASE", driftPct: 0.004 });
  await refreshAll();
});

document.getElementById("tick-down").addEventListener("click", async () => {
  await api.post("/api/sim/tick", { symbol: "CASE_CS2_WEAPON_CASE", driftPct: -0.004 });
  await refreshAll();
});

document.getElementById("tick-flat").addEventListener("click", async () => {
  await api.post("/api/sim/tick", { symbol: "CASE_CS2_WEAPON_CASE", driftPct: 0 });
  await refreshAll();
});

document.getElementById("reset").addEventListener("click", async () => {
  await api.post("/api/sim/reset");
  await refreshAll();
});

await loadCatalog();
await refreshAll();
setInterval(refreshAll, 10000);

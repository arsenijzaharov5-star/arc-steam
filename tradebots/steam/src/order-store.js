const { JsonStore } = require("./stores/json-store");

class TradeOrderStore {
  constructor(filePath) {
    this.store = new JsonStore(filePath, []);
  }

  list() {
    const orders = this.store.read();
    return Array.isArray(orders) ? orders : [];
  }

  listQueued() {
    return this.list().filter((order) => ["queued", "validated"].includes(order.status));
  }

  upsert(order) {
    const orders = this.list();
    const index = orders.findIndex((item) => item.id === order.id);
    const next = {
      ...order,
      updatedAt: new Date().toISOString()
    };
    if (index === -1) orders.unshift(next);
    else orders[index] = { ...orders[index], ...next };
    this.store.write(orders);
    return next;
  }

  updateStatus(id, status, patch = {}) {
    const orders = this.list();
    const index = orders.findIndex((item) => item.id === id);
    if (index === -1) return null;
    orders[index] = {
      ...orders[index],
      ...patch,
      status,
      updatedAt: new Date().toISOString()
    };
    this.store.write(orders);
    return orders[index];
  }
}

module.exports = { TradeOrderStore };

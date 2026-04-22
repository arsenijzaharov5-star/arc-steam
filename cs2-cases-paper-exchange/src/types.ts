export type Side = "long" | "short";
export type OrderType = "market";

export interface Instrument {
  id: number;
  symbol: string;
  name: string;
}

export interface PriceTick {
  id: number;
  instrumentId: number;
  ts: string;
  price: number;
  volume: number;
}

export interface Account {
  id: number;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface Position {
  id: number;
  accountId: number;
  instrumentId: number;
  symbol: string;
  side: Side;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  status: "open" | "closed" | "liquidated";
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  accountId: number;
  instrumentId: number;
  symbol: string;
  side: Side;
  size: number;
  type: OrderType;
  leverage: number;
  price: number;
  status: "filled" | "rejected";
  reason: string | null;
  createdAt: string;
}

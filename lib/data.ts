export type Stock = {
  symbol: string;
  name: string;
  short: string;
  sector: string;
  exchange: string;
  price: number;
  change: number;
  volume: string;
  cap: string;
  quoteAt?: number;
  color: string;
  history: number[];
};

export type Tone = 'ceil' | 'up' | 'ref' | 'down' | 'floor';

const priceLimits: Record<string, number> = { HOSE: 7, HNX: 10, UPCOM: 15 };

export const priceTone = (stock: Stock): Tone => {
  const limit = priceLimits[stock.exchange] ?? 7;
  return stock.change >= limit - 0.1
    ? 'ceil'
    : stock.change <= -(limit - 0.1)
      ? 'floor'
      : stock.change > 0
        ? 'up'
        : stock.change < 0
          ? 'down'
          : 'ref';
};

export const number = (value: number, digits = 0) =>
  new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const signed = (value: number, digits = 2) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${number(Math.abs(value), digits)}`;

export type Article = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tickers: string[];
  image: string;
  time: string;
  read: string;
  body: string[];
};

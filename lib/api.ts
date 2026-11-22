import type { Article, Stock } from './data';

export const API_UNAVAILABLE_MESSAGE = 'Hệ thống đang bị lỗi. Hãy thử tải lại sau ít phút. Xin cảm ơn';
export const API_BASE_URL = (
  process.env.NODE_ENV === 'production'
    ? 'https://finsights-prod-node-01.tail73ddb8.ts.net:10000'
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080'
).replace(/\/$/, '');
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1023695913206-ls0utf87gs2a0n4cenc157ia4uho4fep.apps.googleusercontent.com';
export const AUTH_STORAGE_KEY = 'finsight-access-token';

export type MarketIndex = {
  symbol: string;
  name: string;
  value: number;
  change: number;
  percent: number;
  exchange: string;
  volume: string;
  quoteAt: number;
};
export type Candle = { time_unix_ms: number; open: string; high: string; low: string; close: string; volume: string };
export type FinancialValue = {
  line_key: string; source_label: string; canonical_name: string; statement_family: string;
  metric_group: string; value: string; original_value: string; unit: string;
  unit_multiplier: string; currency: string; row_order: number;
};
export type FinancialPeriod = {
  period_code: string; fiscal_year: number; fiscal_quarter: number; period_type: string;
  period_end: string; currency: string; audit_status: string; values: FinancialValue[];
};
export type FinancialDocument = {
  uid: string; symbol: string; source_code: string; kind: string; title: string;
  summary: string; published_at_unix_ms: number; original_url: string; mime_type: string;
  document_asset_uid: string; rights_status: string;
};
export type APIArticle = Article & {
  sourceName: string; sourceURL: string; publisherCode: string; publishedAt: number; bodyMarkdown: string;
};

export class APIError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  const timeout = new AbortController();
  const timeoutId = window.setTimeout(() => timeout.abort(), 12000);
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal ?? timeout.signal,
    });
  } catch {
    throw new APIError(API_UNAVAILABLE_MESSAGE, 0);
  } finally {
    window.clearTimeout(timeoutId);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) throw new APIError(API_UNAVAILABLE_MESSAGE, response.status);
    const message = typeof body?.message === 'string' ? body.message : `API trả về lỗi ${response.status}`;
    throw new APIError(message, response.status);
  }
  return body as T;
}

const numeric = (value?: string) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};
const compact = (value: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const palette = ['#df7837', '#20764f', '#28507c', '#3468b9', '#bb3f39', '#4265a2', '#ae303d', '#2670ab'];

export function mapStock(value: Record<string, unknown>): Stock {
  const symbol = String(value.symbol || '').toUpperCase();
  const price = numeric(String(value.price || '0'));
  const marketCap = numeric(String(value.market_cap || '0'));
  return {
    symbol,
    name: String(value.name || symbol),
    short: String(value.short_name || value.name || symbol),
    sector: String(value.sector || 'Khác'),
    exchange: String(value.exchange || ''),
    price,
    change: numeric(String(value.change || '0')),
    volume: compact(numeric(String(value.volume || '0'))),
    cap: marketCap ? compact(marketCap) : '—',
    quoteAt: Number(value.quote_at_unix_ms || 0),
    color: palette[[...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length],
    history: [],
  };
}
export function mapIndex(value: Record<string, unknown>): MarketIndex {
  return {
    symbol: String(value.symbol || ''), name: String(value.name || value.symbol || ''),
    value: numeric(String(value.value || '0')), change: numeric(String(value.change || '0')),
    percent: numeric(String(value.change_percent || '0')), exchange: String(value.exchange || ''),
    volume: compact(numeric(String(value.volume || '0'))), quoteAt: Number(value.quote_at_unix_ms || 0),
  };
}
export function mapArticle(value: Record<string, unknown>): APIArticle {
  const publishedAt = Number(value.published_at_unix_ms || 0);
  const symbols = Array.isArray(value.symbols) ? value.symbols.map(String) : [];
  const date = publishedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(publishedAt) : 'Thời gian chưa rõ';
  return {
    slug: String(value.slug || ''), title: String(value.title || ''),
    description: String(value.description || ''), category: String(value.category || 'Tin doanh nghiệp'),
    tickers: symbols, image: String(value.image_url || ''), time: date,
    read: String(value.source_name || 'Nguồn tin'), body: [],
    sourceName: String(value.source_name || 'Nguồn tin'), sourceURL: String(value.source_url || ''),
    publisherCode: String(value.publisher_code || ''), publishedAt,
    bodyMarkdown: String(value.body_markdown || ''),
  };
}

export async function listStocks(limit = 100, offset = 0) {
  const data = await request<{ stocks?: Record<string, unknown>[]; total?: number }>(`/stocks?limit=${limit}&offset=${offset}`);
  return { stocks: (data.stocks || []).map(mapStock), total: Number(data.total || 0) };
}
export async function listAllStocks() {
  const first = await listStocks(100, 0);
  const pageCount = Math.min(Math.ceil(first.total / 100), 20);
  const pages = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, page) => listStocks(100, (page + 1) * 100)));
  return [...first.stocks, ...pages.flatMap((page) => page.stocks)];
}
export async function listIndices() {
  const data = await request<{ indices?: Record<string, unknown>[] }>('/indices');
  return (data.indices || []).map(mapIndex);
}
export async function listNews(options: { limit?: number; offset?: number; symbol?: string; category?: string; query?: string } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(options.limit || 24));
  params.set('offset', String(options.offset || 0));
  if (options.symbol) params.set('symbol', options.symbol);
  if (options.category) params.set('category', options.category);
  if (options.query) params.set('q', options.query);
  const data = await request<{ articles?: Record<string, unknown>[]; total?: number }>(`/news?${params}`);
  return { articles: (data.articles || []).map(mapArticle), total: Number(data.total || 0) };
}
export async function getNews(slug: string) {
  const data = await request<Record<string, unknown>>(`/news/${encodeURIComponent(slug)}`);
  return mapArticle(data);
}
export async function getCandles(symbol: string, range: string, index = false) {
  const path = index ? `/indices/${encodeURIComponent(symbol)}/candles` : `/stocks/${encodeURIComponent(symbol)}/candles`;
  const data = await request<{ candles?: Candle[] }>(`${path}?range=${encodeURIComponent(range)}`);
  return data.candles || [];
}
export async function getStockFinancials(symbol: string, periodType = '') {
  const query = periodType ? `?period_type=${encodeURIComponent(periodType)}` : '';
  return request<{ symbol: string; periods?: FinancialPeriod[] }>(`/stocks/${encodeURIComponent(symbol)}/financials${query}`);
}
export async function listFinancialDocuments(options: { symbol?: string; kind?: string; limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(options.limit || 50));
  params.set('offset', String(options.offset || 0));
  if (options.symbol) params.set('symbol', options.symbol);
  if (options.kind) params.set('kind', options.kind);
  return request<{ documents?: FinancialDocument[]; total?: number }>(`/financial-reports?${params}`);
}
export async function loginWithGoogle(idToken: string) {
  return request<{ access_token: string; email: string; account_id: string; expires_at_unix_ms: number }>('/auth/google', {
    method: 'POST', body: JSON.stringify({ id_token: idToken }),
  });
}
export async function getWatchlist(token: string) {
  const data = await request<{ symbols?: string[] }>('/users/me/watchlist', {}, token);
  return data.symbols || [];
}
export async function changeWatchlist(token: string, symbol: string, add: boolean) {
  const data = await request<{ symbols?: string[] }>(add ? '/users/me/watchlist' : `/users/me/watchlist/${encodeURIComponent(symbol)}`, {
    method: add ? 'POST' : 'DELETE', ...(add ? { body: JSON.stringify({ symbol }) } : {}),
  }, token);
  return data.symbols || [];
}
export async function askAI(token: string, message: string, sessionId = '') {
  return request<{ session_id: string; answer: string; stock_symbols?: string[]; article_slugs?: string[] }>(
    '/ai/chat', { method: 'POST', body: JSON.stringify({ message, session_id: sessionId }) }, token,
  );
}
export async function listAISessions(token: string) {
  const data = await request<{ sessions?: { session_id: string; title: string; updated_at?: string }[] }>('/ai/sessions?limit=20', {}, token);
  return data.sessions || [];
}
export async function getAISessionMessages(token: string, sessionId: string) {
  return request<{ session_id: string; messages?: { speaker: string; message_text: string; created_at?: string }[] }>(`/ai/sessions/${encodeURIComponent(sessionId)}/messages`, {}, token);
}
export async function deleteAISession(token: string, sessionId: string) {
  return request<{ closed: boolean }>(`/ai/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }, token);
}

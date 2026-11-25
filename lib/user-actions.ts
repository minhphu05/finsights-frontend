'use server';

import { userRequest, type Result } from './gateway';

/** Action arguments come from the browser: keep them to a single path segment. */
function segment(value: string) {
  const text = String(value);
  return text === '.' || text === '..' ? '' : encodeURIComponent(text);
}

async function symbolsRequest(path: string, init?: RequestInit): Promise<Result<string[]>> {
  const result = await userRequest<{ symbols?: string[] }>(path, init);
  return result.ok ? { ok: true, data: result.data.symbols || [] } : result;
}

export async function getWatchlist() {
  return symbolsRequest('/users/me/watchlist');
}

export async function changeWatchlist(symbol: string, add: boolean) {
  return add
    ? symbolsRequest('/users/me/watchlist', { method: 'POST', body: JSON.stringify({ symbol: String(symbol) }) })
    : symbolsRequest(`/users/me/watchlist/${segment(symbol)}`, { method: 'DELETE' });
}

export async function askAI(message: string, sessionId = '') {
  return userRequest<{ session_id: string; answer: string; stock_symbols?: string[]; article_slugs?: string[] }>(
    '/ai/chat', { method: 'POST', body: JSON.stringify({ message: String(message), session_id: String(sessionId) }) },
  );
}

export async function deleteAISession(sessionId: string) {
  return userRequest<{ closed: boolean }>(`/ai/sessions/${segment(sessionId)}`, { method: 'DELETE' });
}

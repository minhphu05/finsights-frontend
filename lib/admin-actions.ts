'use server';

import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE = 'finsight-admin-session';
const GATEWAY_URL = (process.env.API_BASE_URL || '').replace(/\/$/, '');

export type AdminProfile = { admin_id: string; username: string };
export type AdminRecord = {
  admin_id: string;
  username: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_login_at: string;
};
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function readResponse<T>(response: Response): Promise<ActionResult<T>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : `API trả về lỗi ${response.status}`;
    return { ok: false, message };
  }
  return { ok: true, data: body as T };
}

async function callBackend<T>(path: string, init: RequestInit = {}, token?: string): Promise<ActionResult<T>> {
  if (!GATEWAY_URL) return { ok: false, message: 'API quản trị chưa được cấu hình.' };
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/admin${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(12000),
    });
    return readResponse<T>(response);
  } catch {
    return { ok: false, message: 'Không kết nối được API quản trị. Hãy thử lại sau ít phút.' };
  }
}

async function storedToken() {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value ?? '';
}

async function clearToken() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function adminLoginAction(username: string, password: string): Promise<ActionResult<AdminProfile>> {
  const result = await callBackend<{ admin_id: string; username: string; access_token: string; expires_at_unix_ms: number }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!result.ok) return result;
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, result.data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(result.data.expires_at_unix_ms),
  });
  return { ok: true, data: { admin_id: result.data.admin_id, username: result.data.username } };
}

export async function verifyAdminSessionAction(): Promise<ActionResult<AdminProfile>> {
  const token = await storedToken();
  if (!token) return { ok: false, message: 'Chưa đăng nhập admin.' };
  const result = await callBackend<AdminProfile>('/auth/me', {}, token);
  if (!result.ok && /401|403|expired|invalid|access/i.test(result.message)) await clearToken();
  return result;
}

export async function logoutAdminAction() {
  await clearToken();
}

export async function listAdminAccountsAction(): Promise<ActionResult<AdminRecord[]>> {
  const token = await storedToken();
  if (!token) return { ok: false, message: 'Phiên admin đã hết hạn. Hãy đăng nhập lại.' };
  const result = await callBackend<{ admins?: AdminRecord[] }>('/admins', {}, token);
  if (!result.ok && /401|403|expired|invalid|access/i.test(result.message)) await clearToken();
  return result.ok ? { ok: true, data: result.data.admins ?? [] } : result;
}

export async function createAdminAccountAction(username: string, password: string): Promise<ActionResult<AdminRecord>> {
  const token = await storedToken();
  if (!token) return { ok: false, message: 'Phiên admin đã hết hạn. Hãy đăng nhập lại.' };
  const result = await callBackend<AdminRecord>('/admins', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, token);
  if (!result.ok && /401|403|expired|invalid|access/i.test(result.message)) await clearToken();
  return result;
}

export type ProviderKey = { provider: string; configured: boolean; last4: string | null; updated_at: string | null };
export type HealthStatus = 'ok' | 'error' | 'not_configured';
export type ProviderHealth = { id: string; status: HealthStatus; model: string; default: boolean; keys: string[]; latency_ms: number | null; detail: string | null };
export type LlmProfileHealth = { status: HealthStatus; models: Record<string, string>; keys: string[]; latency_ms: number | null; detail: string | null };
export type ProvidersHealth = { status: HealthStatus; embedding: ProviderHealth[]; rerank: ProviderHealth[]; jev: ProviderHealth; llm: Record<string, LlmProfileHealth> };

// Provider keys live in the AI service, reached through the backend gateway, which checks the
// admin token. Its errors use `error`, the AI service's use `detail`.
async function callAiService<T>(path: string, init: RequestInit = {}): Promise<ActionResult<T>> {
  if (!GATEWAY_URL) return { ok: false, message: 'API quản trị chưa được cấu hình.' };
  const token = await storedToken();
  if (!token) return { ok: false, message: 'Phiên admin đã hết hạn. Hãy đăng nhập lại.' };
  const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
  if (init.body) headers.set('Content-Type', 'application/json');
  try {
    // A health check calls every configured provider, so it gets longer than other admin calls.
    const response = await fetch(`${GATEWAY_URL}/api/v1/admin/ai${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (response.status === 204) return { ok: true, data: null as T };
    const body = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403) {
      await clearToken();
      return { ok: false, message: 'Phiên admin đã hết hạn. Hãy đăng nhập lại.' };
    }
    if (!response.ok) {
      const message = body?.detail ?? body?.error;
      return { ok: false, message: typeof message === 'string' ? message : `API trả về lỗi ${response.status}.` };
    }
    if (!body) return { ok: false, message: 'API trả về dữ liệu không đọc được.' };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, message: 'Không kết nối được API quản trị. Hãy thử lại sau ít phút.' };
  }
}

export async function listProviderKeysAction(): Promise<ActionResult<ProviderKey[]>> {
  const result = await callAiService<{ keys: ProviderKey[] }>('/admin/keys');
  return result.ok ? { ok: true, data: result.data.keys } : result;
}

export async function saveProviderKeyAction(provider: string, key: string): Promise<ActionResult<ProviderKey>> {
  return callAiService<ProviderKey>(`/admin/keys/${encodeURIComponent(provider)}`, { method: 'PUT', body: JSON.stringify({ key }) });
}

export async function deleteProviderKeyAction(provider: string): Promise<ActionResult<null>> {
  return callAiService<null>(`/admin/keys/${encodeURIComponent(provider)}`, { method: 'DELETE' });
}

// Retrieval benchmark of the AI service. A run takes minutes: start it, then poll it by id.
export type EvalOption = { id: string; configured: boolean };
export type EvalOptions = { embeddings: EvalOption[]; reranks: EvalOption[]; decisions: EvalOption[] };
export type EvalCase = { id?: string; category?: string; question: string; query?: string; date_from: string; date_to: string; relevant: string[]; irrelevant?: string[]; evidence?: string[] };
export type EvalRequest = { dataset: string; embedding: string; rerank: string; decision: string; cases: EvalCase[] };
export type EvalScores = Record<string, number | null> & { cases: number; 'unjudged@10': number };
export type EvalApiRun = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'interrupted';
  created_at: string;
  finished_at: string | null;
  dataset: string;
  embedding: string;
  rerank: string;
  decision: string;
  progress: { done: number; total: number };
  results: { id: string; overall: EvalScores; byCategory: Record<string, EvalScores> }[];
  skipped: { id: string; reason: string }[];
  failed: { id: string; reason: string }[];
  error: string | null;
};

export async function evalOptionsAction(): Promise<ActionResult<EvalOptions>> {
  return callAiService<EvalOptions>('/admin/evals/options');
}

export async function startEvalRunAction(request: EvalRequest): Promise<ActionResult<EvalApiRun>> {
  return callAiService<EvalApiRun>('/admin/evals/retrieval', { method: 'POST', body: JSON.stringify(request) });
}

export async function getEvalRunAction(id: string): Promise<ActionResult<EvalApiRun>> {
  return callAiService<EvalApiRun>(`/admin/evals/retrieval/${encodeURIComponent(id)}`);
}

export async function listEvalRunsAction(): Promise<ActionResult<EvalApiRun[]>> {
  const result = await callAiService<{ runs: EvalApiRun[] }>('/admin/evals/retrieval');
  return result.ok ? { ok: true, data: result.data.runs } : result;
}

export async function providersHealthAction(): Promise<ActionResult<ProvidersHealth>> {
  return callAiService<ProvidersHealth>('/health/providers');
}

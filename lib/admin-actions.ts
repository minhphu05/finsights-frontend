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

// Provider keys live in the AI service. Behind the gateway, set AI_SERVICE_URL to its route;
// `next dev` falls back to a local AI service.
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '');

export type ProviderKey = { provider: string; configured: boolean; last4: string | null; updated_at: string | null };
export type HealthStatus = 'ok' | 'error' | 'not_configured';
export type ProviderHealth = { id: string; status: HealthStatus; model: string; default: boolean; keys: string[]; latency_ms: number | null; detail: string | null };
export type LlmProfileHealth = { status: HealthStatus; models: Record<string, string>; keys: string[]; latency_ms: number | null; detail: string | null };
export type ProvidersHealth = { status: HealthStatus; embedding: ProviderHealth[]; rerank: ProviderHealth[]; jev: ProviderHealth; llm: Record<string, LlmProfileHealth> };

async function callAiService<T>(path: string, init: RequestInit = {}): Promise<ActionResult<T>> {
  // Server actions are public endpoints, so a signed-in admin is required outside local dev.
  if (process.env.NODE_ENV !== 'development') {
    const session = await verifyAdminSessionAction();
    if (!session.ok) return session;
  }
  if (!AI_SERVICE_URL) return { ok: false, message: 'Chưa cấu hình địa chỉ AI service.' };
  const headers = new Headers({ Accept: 'application/json' });
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = await storedToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    const response = await fetch(`${AI_SERVICE_URL}${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (response.status === 204) return { ok: true, data: null as T };
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, message: typeof body?.detail === 'string' ? body.detail : `AI service trả về lỗi ${response.status}.` };
    if (!body) return { ok: false, message: 'AI service trả về dữ liệu không đọc được.' };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, message: 'Không kết nối được AI service. Kiểm tra service đã chạy chưa rồi thử lại.' };
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

export async function providersHealthAction(): Promise<ActionResult<ProvidersHealth>> {
  return callAiService<ProvidersHealth>('/health/providers');
}

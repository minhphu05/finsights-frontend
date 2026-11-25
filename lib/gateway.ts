// Server-side only: backend calls that need the user's session.
// The access token lives in httpOnly cookies and is never readable by browser scripts.
import 'server-only';
import { cookies } from 'next/headers';
import { API_BASE_URL, API_UNAVAILABLE_MESSAGE } from './api';

const GATEWAY_URL = (process.env.API_BASE_URL || API_BASE_URL).replace(/\/$/, '');
const TOKEN_COOKIE = 'finsight-session';
const EMAIL_COOKIE = 'finsight-user-email';

export type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

export async function startSession(token: string, email: string, expiresAt: number) {
  const store = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    // Without a usable expiry the cookies last until the browser closes.
    ...(expiresAt > Date.now() ? { expires: new Date(expiresAt) } : {}),
  };
  store.set(TOKEN_COOKIE, token, options);
  store.set(EMAIL_COOKIE, email, options);
}

export async function readSession() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  return token ? { token, email: store.get(EMAIL_COOKIE)?.value || '' } : null;
}

export async function endSession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(EMAIL_COOKIE);
}

export async function gatewayRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<Result<T>> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}/api/v1${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return { ok: false, status: 0, message: API_UNAVAILABLE_MESSAGE };
  }
  const body = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, data: body as T };
  if (response.status >= 500) return { ok: false, status: response.status, message: API_UNAVAILABLE_MESSAGE };
  const message = typeof body?.message === 'string' ? body.message : `API trả về lỗi ${response.status}`;
  return { ok: false, status: response.status, message };
}

/** A request on behalf of the signed-in user. A refused token ends the session. */
export async function userRequest<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  const session = await readSession();
  if (!session) return { ok: false, status: 401, message: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' };
  const result = await gatewayRequest<T>(path, init, session.token);
  if (!result.ok && result.status === 401) await endSession();
  return result;
}

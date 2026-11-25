'use server';

import { endSession, gatewayRequest, readSession, startSession, type Result } from './gateway';

export async function signInWithGoogle(idToken: string): Promise<Result<null>> {
  const result = await gatewayRequest<{ access_token: string; email: string; expires_at_unix_ms: number | string }>('/auth/google', {
    method: 'POST', body: JSON.stringify({ id_token: String(idToken) }),
  });
  if (!result.ok) return result;
  const { access_token, email, expires_at_unix_ms } = result.data;
  await startSession(access_token, email, Number(expires_at_unix_ms));
  return { ok: true, data: null };
}

/** Who is signed in, without the token. */
export async function getSession() {
  const session = await readSession();
  return session && { email: session.email };
}

export async function signOut() {
  await endSession();
}

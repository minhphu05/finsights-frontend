'use client';

import { useEffect, useState } from 'react';
import { homeStyles as ui } from './home-styles';

type User = { name: string; email: string; picture?: string };
type TokenResponse = { access_token?: string; error?: string };
type GoogleWindow = Window & {
  google?: { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback?: () => void }) => { requestAccessToken: () => void } } } };
};

const STORAGE_KEY = 'finsight-user';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const loadScript = () => new Promise<void>((resolve, reject) => {
  if ((window as GoogleWindow).google) return resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  const script = existing ?? Object.assign(document.createElement('script'), { src: SCRIPT_SRC, async: true });
  script.addEventListener('load', () => resolve(), { once: true });
  script.addEventListener('error', () => reject(new Error('gsi')), { once: true });
  if (!existing) document.head.append(script);
});

/** Header button: signs the visitor in with their Google (Gmail) account, entirely in the browser. */
export default function GoogleLogin() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  const signIn = async () => {
    if (!clientId) { setError('Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID'); return; }
    setBusy(true);
    setError('');
    try {
      await loadScript();
      const client = (window as GoogleWindow).google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async ({ access_token }) => {
          try {
            if (!access_token) throw new Error('token');
            const info = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${access_token}` } })).json();
            const next: User = { name: info.name || info.email, email: info.email, picture: info.picture };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setUser(next);
          } catch { setError('Đăng nhập thất bại'); }
          setBusy(false);
        },
        error_callback: () => setBusy(false),
      });
      client.requestAccessToken();
    } catch {
      setError('Không tải được Google');
      setBusy(false);
    }
  };

  const signOut = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setUser(null);
  };

  if (user) {
    return (
      <button onClick={signOut} title={`${user.email} — bấm để đăng xuất`} className="flex min-h-10 items-center gap-2 whitespace-nowrap hover:text-primary/75 max-[400px]:hidden">
        {user.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full object-cover" />}
        <span className="max-w-[110px] truncate max-[1150px]:hidden">{user.name}</span>
        <span className="text-[10px] text-primary/70">Đăng xuất</span>
      </button>
    );
  }
  return (
    <button onClick={signIn} disabled={busy} title={error || 'Đăng nhập bằng Gmail'} className={`${ui.primaryButton} rounded-xs px-6 py-[11px] whitespace-nowrap max-[560px]:px-3 max-[560px]:py-[9px] max-[560px]:text-[10px] max-[400px]:hidden disabled:opacity-60`}>
      {error || 'Đăng nhập'}
    </button>
  );
}

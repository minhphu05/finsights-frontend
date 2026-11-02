'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('finsight-theme', next ? 'dark' : 'light'); } catch {}
  }

  return (
    <button type="button" className="grid size-10 shrink-0 place-items-center rounded-xs border border-solid border-primary/30 text-primary hover:bg-primary/10 focus-visible:outline-primary" onClick={toggle} aria-label={dark ? 'Bật chế độ sáng' : 'Bật chế độ tối'} aria-pressed={dark} title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
      {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </button>
  );
}

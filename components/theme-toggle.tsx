'use client';

import { useCallback, useEffect, useState } from 'react';
import { ThemeToggler, type Resolved, type ThemeSelection } from '@animate-ui/react/primitives/effects/theme-toggler';
import { Moon, Sun } from './icons';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Resolved>('light');

  useEffect(() => {
    const root = document.documentElement;
    const dark = root.dataset.theme === 'dark';
    root.classList.toggle('dark', dark);
    setTheme(dark ? 'dark' : 'light');
    // ThemeToggler flips only the `dark` class inside its view transition; mirror it onto data-theme (what the CSS and the price chart watch) so the new snapshot shows the new theme.
    const observer = new MutationObserver(() => {
      const next = root.classList.contains('dark') ? 'dark' : 'light';
      if (root.dataset.theme !== next) root.dataset.theme = next;
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const apply = useCallback((selection: ThemeSelection) => {
    const next: Resolved = selection === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('finsight-theme', next); } catch {}
    setTheme(next);
  }, []);

  return (
    <ThemeToggler theme={theme} resolvedTheme={theme} setTheme={apply}>
      {({ resolved, toggleTheme }) => {
        const dark = resolved === 'dark';
        return (
          <button type="button" className="grid size-10 shrink-0 place-items-center rounded-xs border border-solid border-primary/30 text-primary hover:bg-primary/10 focus-visible:outline-primary" onClick={() => toggleTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Bật chế độ sáng' : 'Bật chế độ tối'} aria-pressed={dark} title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
            {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
        );
      }}
    </ThemeToggler>
  );
}

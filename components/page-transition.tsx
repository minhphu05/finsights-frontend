'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Route loader: the fox tail spins only while the next route is on its way, and clears as soon as it arrives. */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const fade = useRef<Animation>(undefined);
  const waiting = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reveal = () => {
    const screen = overlay.current;
    if (!screen || !waiting.current) return;
    waiting.current = false;
    clearTimeout(fallback.current);
    if (!location.hash) window.scrollTo(0, 0);
    // Start from the current opacity, so a route that arrives instantly never flashes the full loader.
    const from = getComputedStyle(screen).opacity;
    fade.current?.cancel();
    fade.current = screen.animate([{ opacity: from }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
    fade.current.onfinish = () => { screen.style.visibility = 'hidden'; };
  };

  useEffect(reveal, [pathname]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onClick = (event: MouseEvent) => {
      if (motion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.target || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-transition')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      event.preventDefault();
      const screen = overlay.current;
      if (screen && !waiting.current) {
        waiting.current = true;
        fade.current?.cancel();
        screen.style.visibility = 'visible';
        fade.current = screen.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out', fill: 'forwards' });
      }
      clearTimeout(fallback.current);
      fallback.current = setTimeout(reveal, 10000);
      router.push(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return (
    <div ref={overlay} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-ink) 88%, transparent)', opacity: 0, visibility: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/finsights-tail.png" alt="" width={96} height={96} className="animate-spin [animation-duration:1.2s]" />
    </div>
  );
}

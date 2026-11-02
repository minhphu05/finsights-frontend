'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
const SKEW = 'skewX(-10deg)';
const slide = (x: string) => `translateX(${x}) ${SKEW}`;

/** Cinematic wipe between routes: an ink curtain sweeps over the page, holds the mark, then sweeps away on the new route. */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const state = useRef<'idle' | 'covering' | 'waiting'>('idle');
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  const reveal = () => {
    const curtain = panel.current;
    const logo = mark.current;
    if (!curtain || !logo) return;
    clearTimeout(fallback.current);
    window.scrollTo(0, 0);
    logo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' });
    curtain.animate([{ transform: slide('-15vw') }, { transform: slide('-130vw') }], { duration: 900, delay: 220, easing: EASE, fill: 'forwards' }).onfinish = () => {
      curtain.style.visibility = 'hidden';
      state.current = 'idle';
    };
  };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (state.current === 'waiting') reveal();
  }, [pathname]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onClick = (event: MouseEvent) => {
      if (motion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.target || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-transition')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      event.preventDefault();
      if (state.current !== 'idle') return;
      const curtain = panel.current;
      const logo = mark.current;
      if (!curtain || !logo) { router.push(url.pathname + url.search + url.hash); return; }
      state.current = 'covering';
      curtain.style.visibility = 'visible';
      logo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 450, fill: 'forwards' });
      curtain.animate([{ transform: slide('100vw') }, { transform: slide('-15vw') }], { duration: 750, easing: EASE, fill: 'forwards' }).onfinish = () => {
        state.current = 'waiting';
        router.push(url.pathname + url.search + url.hash);
        fallback.current = setTimeout(reveal, 3000);
      };
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', overflow: 'hidden' }}>
      <div ref={panel} style={{ position: 'absolute', top: 0, left: 0, width: '130vw', height: '100%', background: '#0b0b0b', transform: slide('100vw'), visibility: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: '#eadfce' }} />
      </div>
      <div ref={mark} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/finsight-mark.svg" alt="" style={{ height: 72, width: 'auto' }} />
      </div>
    </div>
  );
}

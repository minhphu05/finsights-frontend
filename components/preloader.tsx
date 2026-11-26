'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
const SKEW = 'skewX(-10deg)';
const slide = (x: string) => `translateX(${x}) ${SKEW}`;
const MAX_MS = 7000;
const SEEN = 'finsight-intro-seen';

/** Intro on the first visit of a session: the 4s logo clip plays while fonts and the hero video load, then the curtain wipes into the page. */
export default function Preloader() {
  const pathname = usePathname();
  const [gone, setGone] = useState(false);
  const curtain = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const home = useRef(pathname === '/');

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN)) { setGone(true); return; }
    } catch {}
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    root.style.overflow = 'hidden';

    const waits: Promise<unknown>[] = [
      new Promise(resolve => (document.readyState === 'complete' ? resolve(null) : window.addEventListener('load', () => resolve(null), { once: true }))),
      document.fonts?.ready ?? Promise.resolve(),
    ];
    const video = home.current ? document.querySelector<HTMLVideoElement>('video[data-hero-image]') : null;
    if (video && video.readyState < 2) waits.push(new Promise(resolve => video.addEventListener('loadeddata', () => resolve(null), { once: true })));
    // The curtain stays until the clip has played through; a clip that cannot play must not block the page.
    const intro = clip.current;
    if (intro && !motion && !intro.ended && !intro.error) {
      waits.push(new Promise(resolve => {
        intro.addEventListener('ended', resolve, { once: true });
        intro.addEventListener('error', resolve, { once: true });
        // Browsers block audible autoplay until the visitor has interacted with the site, so fall back to a muted run.
        intro.muted = false;
        intro.play().catch(() => { intro.muted = true; intro.play().catch(resolve); });
      }));
    }

    const leave = () => {
      root.style.overflow = '';
      // Flag is written only when the intro ends: StrictMode runs this effect twice in dev, and an early write would cancel the second run.
      const finish = () => {
        try { sessionStorage.setItem(SEEN, '1'); } catch {}
        setGone(true);
      };
      if (motion || !curtain.current || !content.current) { finish(); return; }
      content.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
      curtain.current.animate([{ transform: slide('-15vw') }, { transform: slide('-130vw') }], { duration: 1100, delay: 250, easing: EASE, fill: 'forwards' }).onfinish = finish;
      // Hero copy already played behind the curtain, so replay it as the curtain clears.
      if (home.current && window.scrollY < 100) {
        document.querySelectorAll('[data-hero-line]').forEach((heroLine, position) => heroLine.animate([
          { transform: 'translateY(110%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 1050, delay: 650 + position * 140, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
        document.querySelectorAll('[data-hero-intro]').forEach((element, position) => element.animate([
          { transform: 'translateY(22px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 850, delay: 600 + position * 210, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
      }
    };

    let done = false;
    const exit = () => { if (!done) { done = true; leave(); } };
    let cancelled = false;
    Promise.all(waits).then(() => { if (!cancelled) exit(); });
    const limit = setTimeout(exit, MAX_MS);
    return () => { cancelled = true; clearTimeout(limit); root.style.overflow = ''; };
  }, []);

  if (gone) return null;
  return (
    <div data-preloader aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden', pointerEvents: 'all' }}>
      <style>{'html[data-intro-seen] [data-preloader]{display:none!important}'}</style>
      <div ref={curtain} style={{ position: 'absolute', top: 0, left: 0, width: '130vw', height: '100%', background: '#fff', transform: slide('-15vw') }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: 'var(--color-logo)' }} />
      </div>
      <div ref={content} style={{ position: 'absolute', inset: 0, color: 'var(--color-logo)' }}>
        {/* The clip has a pure white background, so it blends into the curtain when letterboxed on portrait screens. */}
        <video ref={clip} className="absolute inset-0 h-full w-full object-contain landscape:object-cover" src="/videos/finsights-preloader.mp4" playsInline preload="auto" />
        <p style={{ position: 'absolute', left: 0, right: 0, bottom: 44, textAlign: 'center', fontSize: 10, letterSpacing: '0.3em', opacity: 0.7 }}>FINANCE × INSIGHT × INTELLIGENCE</p>
      </div>
    </div>
  );
}

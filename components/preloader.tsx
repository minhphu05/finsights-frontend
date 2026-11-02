'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
const SKEW = 'skewX(-10deg)';
const slide = (x: string) => `translateX(${x}) ${SKEW}`;
const MIN_MS = 1900;
const MAX_MS = 7000;
const SEEN = 'finsight-intro-seen';

/** Intro on the first visit of a session: a rising chart line draws itself while fonts and the hero video load, then the curtain wipes into the page. */
export default function Preloader() {
  const pathname = usePathname();
  const [gone, setGone] = useState(false);
  const curtain = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLImageElement>(null);
  const line = useRef<SVGPathElement>(null);
  const head = useRef<SVGPolygonElement>(null);
  const home = useRef(pathname === '/');

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN)) { setGone(true); return; }
    } catch {}
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    mark.current?.animate([{ opacity: 0, transform: 'translateY(14px) scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 150, easing: EASE, fill: 'forwards' });

    let ready = false;
    let raf = 0;
    let shown = 0;
    const start = performance.now();
    const waits: Promise<unknown>[] = [
      new Promise(resolve => (document.readyState === 'complete' ? resolve(null) : window.addEventListener('load', () => resolve(null), { once: true }))),
      document.fonts?.ready ?? Promise.resolve(),
    ];
    const video = home.current ? document.querySelector<HTMLVideoElement>('video[data-hero-image]') : null;
    if (video && video.readyState < 2) waits.push(new Promise(resolve => video.addEventListener('loadeddata', () => resolve(null), { once: true })));
    Promise.all(waits).then(() => { ready = true; });
    const limit = setTimeout(() => { ready = true; }, MAX_MS);

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

    const tick = (now: number) => {
      const elapsed = now - start;
      const target = ready ? 100 : Math.min(88, elapsed / 55);
      shown += (target - shown) * 0.07;
      if (line.current) line.current.style.strokeDashoffset = String(1 - shown / 100);
      if (head.current) head.current.style.opacity = shown > 96 ? '1' : '0';
      if (ready && elapsed >= MIN_MS && shown > 99) { leave(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(limit); root.style.overflow = ''; };
  }, []);

  if (gone) return null;
  return (
    <div data-preloader aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden', pointerEvents: 'all' }}>
      <style>{'html[data-intro-seen] [data-preloader]{display:none!important}'}</style>
      <div ref={curtain} style={{ position: 'absolute', top: 0, left: 0, width: '130vw', height: '100%', background: '#0b0b0b', transform: slide('-15vw') }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: '#eadfce' }} />
      </div>
      <div ref={content} style={{ position: 'absolute', inset: 0, color: '#eadfce' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={mark} src="/finsight-mark.svg" alt="" style={{ height: 80, width: 'auto', opacity: 0 }} />
          <svg width="220" height="132" viewBox="0 0 180 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 108H170" strokeWidth="1" opacity="0.2" />
            <path ref={line} pathLength={1} d="M10 100 L45 80 L70 90 L105 55 L130 65 L158.8 32.5" style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
            <polygon ref={head} points="168,22 164.1,37.1 153.5,27.9" fill="currentColor" strokeWidth="1" style={{ opacity: 0, transition: 'opacity 0.3s ease' }} />
          </svg>
        </div>
        <p style={{ position: 'absolute', left: 0, right: 0, bottom: 44, textAlign: 'center', fontSize: 10, letterSpacing: '0.3em', opacity: 0.7 }}>FINANCE × INSIGHT × INTELLIGENCE</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { number } from '@/lib/data';

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = 'expo.out';

/** Landing-only scroll story: Lenis drives the scroll, GSAP ScrollTrigger stages each chapter. Native scrolling everywhere else. */
export default function LandingMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== '/') return;
    let lenis: Lenis | null = null;
    const animations = new Set<Animation>();
    const media = gsap.matchMedia();
    const headerOffset = () => (document.querySelector<HTMLElement>('[data-home-header]')?.offsetHeight || 86) + 16;
    const animate = (element: Element, frames: Keyframe[], delay = 0, duration = 850) => {
      const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
      animations.add(animation);
      animation.onfinish = () => { animation.cancel(); animations.delete(animation); };
      return animation;
    };

    media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' }, context => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;

      lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        prevent: element => !!element.closest('dialog, [data-lenis-prevent]'),
      });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      const progress = document.createElement('div');
      progress.className = 'pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-market-accent';
      progress.setAttribute('aria-hidden', 'true');
      document.body.append(progress);
      gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

      // Chapter 0 — hero: pinned while the news section slides over it like a curtain.
      const hero = document.querySelector<HTMLElement>('[data-hero-screen]');
      if (hero) {
        if (window.scrollY < 100) {
          hero.querySelectorAll('[data-hero-line]').forEach((line, position) => animate(line, [
            { transform: 'translateY(110%)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ], 130 + position * 140, 1050));
          hero.querySelectorAll('[data-hero-intro]').forEach((element, position) => animate(element, [
            { transform: 'translateY(22px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ], 100 + position * 210, 850));
        }
        // Explicit start values: the intro animations above are still mid-flight when this timeline reads computed styles.
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', pin: true, pinSpacing: false, scrub: true } })
          .fromTo(hero.querySelectorAll('[data-hero-line]'), { y: 0, yPercent: 0 }, { yPercent: -115, duration: 0.45, stagger: 0.08 }, 0)
          .fromTo(hero.querySelectorAll('[data-hero-intro]'), { y: 0, opacity: 1 }, { y: -48, opacity: 0, duration: 0.4, stagger: 0.05 }, 0)
          .fromTo(hero.querySelectorAll('[data-hero-image]'), { scale: 1.06, filter: 'brightness(1) saturate(0.85)' }, { scale: 1.22, filter: 'brightness(0.35) saturate(0.85)', duration: 1 }, 0);
      }

      // Section titles rise word by word out of a mask; padding keeps Vietnamese diacritics inside the clip.
      document.querySelectorAll<HTMLElement>('[data-split]').forEach(heading => {
        SplitText.create(heading, {
          type: 'words',
          mask: 'words',
          autoSplit: true,
          onSplit: self => {
            gsap.set(self.masks, { paddingBlock: '0.14em', marginBlock: '-0.14em' });
            return gsap.from(self.words, { yPercent: 120, duration: 1.2, stagger: 0.07, ease: EASE, scrollTrigger: { trigger: heading, start: 'top 88%' }});
          },
        });
      });

      // Lead story opens from a framed crop as it scrolls in.
      document.querySelectorAll<HTMLElement>('[data-landing-reveal="image"]').forEach(frame => {
        const scroll = { trigger: frame, start: 'top 95%', end: 'top 30%', scrub: true };
        gsap.fromTo(frame, { clipPath: 'inset(16% 10% 16% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: scroll });
        const image = frame.querySelector('img');
        if (image) {
          gsap.set(image, { transitionProperty: 'scale' });
          gsap.fromTo(image, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: scroll });
        }
      });

      // Everything else enters in staggered batches; rows slide in from the side.
      const reveals = gsap.utils.toArray<HTMLElement>('[data-landing-reveal]:not([data-landing-reveal="image"])').filter(element => element.getBoundingClientRect().bottom > 0);
      // Sideways entrances only where the page gutter can absorb them; on narrow screens they would overflow horizontally.
      reveals.forEach(element => gsap.set(element, element.dataset.landingReveal === 'row' && desktop ? { opacity: 0, x: 70 } : { opacity: 0, y: 56 }));
      ScrollTrigger.batch(reveals, {
        start: 'top 90%',
        onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, y: 0, duration: 1.1, stagger: 0.12, ease: EASE, overwrite: true }),
      });

      document.querySelectorAll<HTMLImageElement>('[data-scroll-image]').forEach(image => {
        gsap.set(image, { transitionProperty: 'scale' });
        gsap.fromTo(image.parentElement, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: image.parentElement, start: 'top 88%' }});
        gsap.fromTo(image, { yPercent: -8, scale: 1.2 }, { yPercent: 8, scale: 1.2, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // Chapter 2 — market: the index strip sweeps in and counts up, the chart draws itself, lists cascade.
      const restores: (() => void)[] = [];
      const countUp = (element: Element) => {
        const text = element.firstChild;
        if (!(text instanceof Text)) return null;
        const final = text.data;
        const digits = final.split(',')[1]?.length ?? 0;
        const target = Number(final.replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(target)) return null;
        // Write into React's own text node (never replace it) and always land on the original string.
        const counter = { value: target * 0.92 };
        restores.push(() => { text.data = final; });
        return gsap.to(counter, { value: target, duration: 1.6, ease: 'power3.out', onUpdate: () => { text.data = number(counter.value, digits); }, onComplete: () => { text.data = final; } });
      };
      const stageMarket = () => {
        const root = document.querySelector<HTMLElement>('[data-market]');
        if (!root) return false;
        const strip = root.firstElementChild;
        if (strip) {
          const timeline = gsap.timeline({ scrollTrigger: { trigger: strip, start: 'top 88%' }})
            .fromTo(strip, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
            .from(strip.querySelectorAll('button > *'), { y: 26, opacity: 0, duration: 0.9, stagger: 0.03, ease: EASE }, 0.45);
          strip.querySelectorAll('button strong').forEach(value => { const tween = countUp(value); if (tween) timeline.add(tween, 0.45); });
        }
        const chart = document.getElementById('home-chart');
        const plot = chart?.querySelector('canvas')?.parentElement;
        if (chart && plot) {
          const axes = [...Array.from(plot.nextElementSibling?.children ?? []), ...Array.from(plot.parentElement?.nextElementSibling?.children ?? [])];
          gsap.timeline({ scrollTrigger: { trigger: chart, start: 'top 75%' }})
            .from(chart.children, { y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: EASE })
            .fromTo(plot, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.35)
            .from(axes, { y: 8, opacity: 0, duration: 0.6, stagger: 0.05, ease: EASE }, 0.9);
        }
        const watch = root.querySelector('aside');
        if (watch) gsap.timeline({ scrollTrigger: { trigger: watch, start: 'top 75%' }})
          .from(watch.children, { y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: EASE })
          .from(watch.querySelectorAll('[data-market-watch] > *'), { ...(desktop ? { x: 40 } : { y: 20 }), opacity: 0, duration: 0.9, stagger: 0.08, ease: EASE }, 0.25);
        const stocks = root.querySelector('[data-market-stocks]');
        if (stocks) gsap.timeline({ scrollTrigger: { trigger: stocks, start: 'top 80%' }})
          .from(stocks.children, { y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: EASE })
          // Rows fade only: any transform would overflow the table's scroll wrapper and flash a scrollbar.
          .from(stocks.querySelectorAll('tbody tr'), { opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power2.out' }, 0.35);
        return true;
      };
      // HomeMarket hydrates later behind Suspense; touching its DOM earlier breaks hydration, so wait for its data-market flag.
      let marketWait: MutationObserver | null = null;
      if (!stageMarket()) {
        marketWait = new MutationObserver(() => {
          if (!document.querySelector('[data-market]')) return;
          marketWait?.disconnect();
          context.add(stageMarket);
          ScrollTrigger.refresh();
        });
        marketWait.observe(document.getElementById('thi-truong') ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-market'] });
      }

      // Final chapter — night falls: the page darkens into the closing statement, then its words light up one by one.
      const story = document.querySelector<HTMLElement>('[data-scroll-story]');
      if (story) {
        const day = story.previousElementSibling ? getComputedStyle(story.previousElementSibling).backgroundColor : '';
        if (day) gsap.fromTo(story, { backgroundColor: day }, { backgroundColor: getComputedStyle(story).backgroundColor, ease: 'none', scrollTrigger: { trigger: story, start: 'top bottom', end: 'top 25%', scrub: true } });
        gsap.fromTo(story.querySelectorAll('[data-scroll-word]'), { opacity: 0.12, filter: 'blur(6px)' }, {
          opacity: 1, filter: 'blur(0px)', stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: story, start: 'top 55%', end: desktop ? 'bottom bottom' : 'center center', scrub: true },
        });
      }

      let refresh = 0;
      const resize = new ResizeObserver(() => { clearTimeout(refresh); refresh = window.setTimeout(() => ScrollTrigger.refresh(), 200); });
      resize.observe(document.querySelector('[data-home] main') ?? document.body);

      return () => {
        clearTimeout(refresh); resize.disconnect(); marketWait?.disconnect();
        restores.forEach(restore => restore());
        gsap.ticker.remove(raf); gsap.ticker.lagSmoothing(500, 33);
        lenis?.destroy(); lenis = null;
        animations.forEach(animation => animation.cancel()); animations.clear();
        progress.remove();
      };
    });

    const anchors = (event: MouseEvent) => {
      if (!lenis || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', url.hash);
      lenis.scrollTo(target, { offset: -headerOffset() });
    };
    const scrollRequest = (event: Event) => {
      if (!lenis) return;
      const { target, block } = (event as CustomEvent<{ target: HTMLElement; block: string }>).detail;
      event.preventDefault();
      lenis.scrollTo(target, { offset: block === 'center' ? -(window.innerHeight - target.offsetHeight) / 2 : -headerOffset() });
    };
    // Keyboard focus must never land on something still waiting to be revealed.
    const revealFocused = (event: FocusEvent) => {
      const hidden = event.target instanceof Element ? event.target.closest('[data-landing-reveal]') : null;
      if (hidden) gsap.set(hidden, { opacity: 1, x: 0, y: 0, overwrite: true });
      animations.forEach(animation => {
        const effect = animation.effect;
        if (effect instanceof KeyframeEffect && effect.target instanceof Element && event.target instanceof Element && effect.target.contains(event.target)) animation.finish();
      });
    };
    document.addEventListener('focusin', revealFocused);
    document.addEventListener('click', anchors, true);
    window.addEventListener('finsight:scroll-to', scrollRequest);
    return () => {
      media.revert();
      document.removeEventListener('focusin', revealFocused);
      document.removeEventListener('click', anchors, true);
      window.removeEventListener('finsight:scroll-to', scrollRequest);
    };
  }, [pathname]);
  return null;
}

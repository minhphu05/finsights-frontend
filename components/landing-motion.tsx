'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/** Landing-only scroll controller; native scrolling remains available everywhere else. */
export default function LandingMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== '/') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | null = null;
    let observer: IntersectionObserver | null = null;
    const animations = new Set<Animation>();
    const hero = document.querySelector<HTMLElement>('[data-hero-screen]');
    const image = hero?.querySelector<HTMLImageElement>('[data-hero-image]');
    const copy = hero?.querySelector<HTMLElement>('[data-hero-copy]');
    const story = document.querySelector<HTMLElement>('[data-scroll-story]');
    const words = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-word]'));
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('[data-scroll-image]'));
    const progress = document.createElement('div');
    progress.className = 'pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-market-accent';
    progress.setAttribute('aria-hidden', 'true');
    let geometry = { heroHeight: 1, storyTop: 0, storyHeight: 1, pageHeight: 1, imageCenters: [] as number[] };
    let resize: ResizeObserver | null = null;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const measure = () => {
      geometry = {
        heroHeight: hero?.offsetHeight || 1,
        storyTop: story ? story.getBoundingClientRect().top + window.scrollY : 0,
        storyHeight: story?.offsetHeight || 1,
        pageHeight: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
        imageCenters: images.map(element => { const rect = element.getBoundingClientRect(); return rect.top + window.scrollY + rect.height / 2; }),
      };
    };
    const paint = (scroll: number) => {
      if (motion.matches) return;
      const heroProgress = clamp(scroll / geometry.heroHeight);
      if (image) image.style.transform = `translate3d(0, ${heroProgress * geometry.heroHeight * 0.18}px, 0) scale(${1.06 + heroProgress * 0.05})`;
      if (copy) {
        copy.style.transform = `translate3d(0, ${heroProgress * 95}px, 0)`;
        copy.style.opacity = String(1 - clamp((heroProgress - 0.12) / 0.65));
      }
      progress.style.transform = `scaleX(${clamp(scroll / geometry.pageHeight)})`;
      images.forEach((element, position) => {
        const distance = (scroll + window.innerHeight / 2 - geometry.imageCenters[position]) / window.innerHeight;
        element.style.transform = `translate3d(0, ${Math.max(-22, Math.min(22, distance * 35))}px, 0) scale(1.12)`;
      });
      if (story) {
        const storyProgress = clamp((scroll + window.innerHeight * 0.7 - geometry.storyTop) / Math.max(window.innerHeight * 0.7, geometry.storyHeight - window.innerHeight * 0.3));
        words.forEach((word, position) => { word.style.opacity = String(0.24 + 0.76 * clamp(storyProgress * (words.length + 2) - position)); });
      }
    };
    const animate = (element: Element, frames: Keyframe[], delay = 0, duration = 850) => {
      const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
      animations.add(animation);
      animation.onfinish = () => { animation.cancel(); animations.delete(animation); };
      return animation;
    };
    const start = () => {
      if (motion.matches || lenis) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        prevent: element => !!element.closest('dialog, [data-lenis-prevent]'),
      });
      document.body.append(progress);
      measure();
      lenis.on('scroll', ({ scroll }) => paint(scroll));
      paint(window.scrollY);
      resize = new ResizeObserver(() => { measure(); paint(window.scrollY); });
      resize.observe(document.body);
      if (window.scrollY < 100) {
        hero?.querySelectorAll('[data-hero-line]').forEach((line, position) => animate(line, [
          { transform: 'translateY(110%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], 130 + position * 140, 1050));
        hero?.querySelectorAll('[data-hero-intro]').forEach((element, position) => animate(element, [
          { transform: 'translateY(22px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], 100 + position * 210, 850));
      }
      const pending = new Map<Element, Animation>();
      document.querySelectorAll<HTMLElement>('[data-landing-reveal]').forEach((element, position) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0) return;
        const imageReveal = element.dataset.landingReveal === 'image';
        const row = element.dataset.landingReveal === 'row';
        const animation = animate(element, imageReveal ? [
          { clipPath: 'inset(16% 0 0 0)', transform: 'translateY(55px)', opacity: 0 },
          { clipPath: 'inset(0% 0 0 0)', transform: 'translateY(0)', opacity: 1 },
        ] : [
          { transform: `translateY(${row ? 28 : 38}px)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], (position % 3) * 90, imageReveal ? 1100 : 850);
        animation.pause();
        pending.set(element, animation);
      });
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          pending.get(entry.target)?.play();
          pending.delete(entry.target);
        });
      }, { rootMargin: '0px 0px -25px 0px', threshold: 0.1 });
      pending.forEach((_animation, element) => observer?.observe(element));
    };
    const stop = () => {
      lenis?.destroy(); lenis = null;
      observer?.disconnect(); observer = null;
      resize?.disconnect(); resize = null;
      animations.forEach(animation => animation.cancel()); animations.clear();
      progress.remove();
      [image, copy, ...images].forEach(element => element?.style.removeProperty('transform'));
      copy?.style.removeProperty('opacity');
      words.forEach(word => word.style.removeProperty('opacity'));
    };
    const changeMotion = () => { stop(); start(); };
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
      lenis.scrollTo(target, { offset: -((document.querySelector<HTMLElement>('[data-home-header]')?.offsetHeight || 86) + 16) });
    };
    const scrollRequest = (event: Event) => {
      if (!lenis) return;
      const { target, block } = (event as CustomEvent<{ target: HTMLElement; block: string }>).detail;
      event.preventDefault();
      lenis.scrollTo(target, { offset: block === 'center' ? -(window.innerHeight - target.offsetHeight) / 2 : -((document.querySelector<HTMLElement>('[data-home-header]')?.offsetHeight || 86) + 16) });
    };
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const focused = event.target;
      animations.forEach(animation => {
        const effect = animation.effect;
        if (effect instanceof KeyframeEffect && effect.target instanceof Element && effect.target.contains(focused)) animation.finish();
      });
    };
    start();
    document.addEventListener('focusin', revealFocused);
    motion.addEventListener('change', changeMotion);
    document.addEventListener('click', anchors, true);
    window.addEventListener('finsight:scroll-to', scrollRequest);
    return () => {
      stop(); motion.removeEventListener('change', changeMotion);
      document.removeEventListener('focusin', revealFocused);
      document.removeEventListener('click', anchors, true);
      window.removeEventListener('finsight:scroll-to', scrollRequest);
    };
  }, [pathname]);
  return null;
}

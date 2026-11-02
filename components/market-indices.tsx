'use client';

import { useLayoutEffect, useRef } from 'react';
import { indices, number, signed } from '@/lib/data';

export default function MarketIndices({ index, active, onSelect }: {
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);
  const previous = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = indicator.current;
    const button = container.current?.querySelectorAll('button')[index];
    if (!element || !button) return;
    const from = getComputedStyle(element).transform;
    animation.current?.cancel();
    const destination = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
    element.style.width = `${button.offsetWidth}px`;
    element.style.height = `${button.offsetHeight}px`;
    element.style.transform = destination;
    element.style.opacity = active ? '1' : '0';
    const shouldAnimate = active && previous.current !== null && previous.current !== index && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldAnimate) {
      // Move directly from the current rendered position, including interrupted transitions.
      animation.current = element.animate([
        { transform: from },
        { transform: destination },
      ], { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    }
    previous.current = index;
  }, [index, active]);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const settle = () => {
      const button = root.querySelector('button[aria-pressed="true"]');
      const element = indicator.current;
      if (!(button instanceof HTMLElement) || !element) return;
      animation.current?.cancel();
      element.style.width = `${button.offsetWidth}px`;
      element.style.height = `${button.offsetHeight}px`;
      element.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
    };
    const observer = new ResizeObserver(settle);
    observer.observe(root);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceMotion = () => { if (motion.matches) animation.current?.cancel(); };
    motion.addEventListener('change', reduceMotion);
    return () => { observer.disconnect(); motion.removeEventListener('change', reduceMotion); animation.current?.cancel(); };
  }, []);

  return (
    <div ref={container} className="relative isolate mt-10 grid grid-cols-2 border-y border-solid border-foreground/20 md:grid-cols-5" aria-label="Các chỉ số thị trường">
      <span ref={indicator} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-0 rounded-xs bg-ink [transform-origin:center] will-change-transform" />
      {indices.map((item, position) => {
        const selected = index === position && active;
        return (
          <button key={item.name} className={`relative z-10 px-5 py-6 text-left transition-colors duration-200 motion-reduce:transition-none md:px-7 ${selected ? 'text-primary' : 'text-foreground'} ${position > 0 ? 'border-l border-solid border-foreground/20' : ''}`} aria-pressed={selected} onClick={() => onSelect(position)}>
            <span className="flex items-center justify-between gap-3 text-[11px] tracking-wider">{item.name}<span className="text-[9px] opacity-65">{item.exchange}</span></span>
            <strong className="mt-3 block font-editorial text-[clamp(24px,2.3vw,36px)] leading-tight font-normal tabular-nums">{number(item.value, 2)}</strong>
            <span className={`mt-2 block text-xs tabular-nums transition-colors duration-200 motion-reduce:transition-none ${selected ? 'text-primary/80' : item.percent < 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{signed(item.percent)}% <span className="ml-2 text-[10px] opacity-75">{signed(item.change)} điểm</span></span>
          </button>
        );
      })}
    </div>
  );
}

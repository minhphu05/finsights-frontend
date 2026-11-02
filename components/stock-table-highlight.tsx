'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type Bounds = { top: number; left: number; width: number; height: number };

/** Shared hover background matching the reference sidebar's parent Highlight spring. */
export default function StockTableHighlight({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const reduceMotion = useReducedMotion();
  const active = hovered ?? focused;

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const measure = () => {
      const row = active ? container.querySelector<HTMLElement>(`tr[data-stock-row="${CSS.escape(active)}"]`) : null;
      if (!row) { setBounds(null); return; }
      const rect = row.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      const next = { top: rect.top - parent.top, left: rect.left - parent.left, width: rect.width, height: rect.height };
      setBounds(previous => previous && Object.keys(next).every(key => previous[key as keyof Bounds] === next[key as keyof Bounds]) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    const table = container.querySelector('table');
    if (table) observer.observe(table);
    return () => observer.disconnect();
  }, [active, children]);

  const rowKey = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('tr[data-stock-row]')?.dataset.stockRow ?? null : null;

  return (
    <div ref={root} className="relative isolate min-w-[690px]" onPointerOver={event => { if (event.pointerType !== 'touch') setHovered(rowKey(event.target)); }} onPointerLeave={() => setHovered(null)} onPointerCancel={() => setHovered(null)} onFocusCapture={event => setFocused(rowKey(event.target))} onBlurCapture={event => setFocused(rowKey(event.relatedTarget))}>
      <AnimatePresence initial={false}>
        {bounds && <motion.div key="row-highlight" data-row-highlight aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-0 rounded-xs bg-foreground/5" initial={{ ...bounds, opacity: 0 }} animate={{ ...bounds, opacity: 1 }} exit={{ opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 35, opacity: { duration: 0.12 } }} />}
      </AnimatePresence>
      {children}
    </div>
  );
}

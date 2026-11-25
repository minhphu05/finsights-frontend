'use client';

import { Select } from '@animate-ui/react/primitives/base-ui/select';
import { Check, ChevronDown } from './icons';

const ALL = 'Tất cả cổ phiếu';
const item = 'grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_16px] items-center gap-3 rounded-xs px-3 py-2.5 text-xs outline-none select-none data-[highlighted]:bg-foreground/10';

/** Stock filter: the chosen symbol in the trigger, a scrollable symbol and company list in the popup. */
export default function StockSelect({ stocks, value, onChange, className = '' }: { stocks: { symbol: string; short: string }[]; value: string; onChange: (symbol: string) => void; className?: string }) {
  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next ?? '')} modal={false}>
      <Select.Trigger aria-label="Lọc tin theo cổ phiếu" className={`group flex w-[200px] cursor-pointer items-center justify-between gap-3 rounded-xs border border-solid border-foreground/25 bg-background px-3 py-2 text-xs text-foreground transition-colors hover:border-foreground/60 data-[popup-open]:border-foreground ${className}`}>
        <span className="truncate">{value ? `${value} · ${stocks.find((stock) => stock.symbol === value)?.short ?? ''}` : ALL}</span>
        <ChevronDown size={14} strokeWidth={1.6} aria-hidden="true" className="shrink-0 transition-transform duration-300 group-data-[popup-open]:rotate-180 motion-reduce:transition-none" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false} align="end" sideOffset={8} className="z-50 outline-none">
          <Select.Popup className="w-[260px] overflow-hidden rounded-xs border border-solid border-foreground/20 bg-background py-1.5 font-sans text-foreground shadow-xl shadow-black/15 outline-none">
            {/* isolate keeps the sliding highlight above the popup background; data-lenis-prevent lets the wheel scroll this list. */}
            <Select.List data-lenis-prevent className="isolate max-h-[min(348px,calc(var(--available-height)-14px))] overflow-y-auto overscroll-contain px-1.5 supports-[-moz-appearance:none]:[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent">
              {[{ symbol: '', short: ALL }, ...stocks].map((stock) => (
                <Select.Item key={stock.symbol} value={stock.symbol} className={item}>
                  {/* The first row has no symbol, so its label spans both columns. */}
                  {stock.symbol && <strong className="font-medium tracking-wider">{stock.symbol}</strong>}
                  <Select.ItemText className={`truncate ${stock.symbol ? 'opacity-70' : 'col-span-2'}`}>{stock.short}</Select.ItemText>
                  <Select.ItemIndicator className="col-start-3"><Check size={14} strokeWidth={1.8} /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

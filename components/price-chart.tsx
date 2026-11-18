'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, Filler, type Plugin } from 'chart.js';
import { number, type Stock } from '@/lib/data';
import { getCandles } from '@/lib/api';
import { useAppData } from './shell';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler);
const rangeLabels = ['1 ngày', '1 tuần', '1 tháng', '3 tháng', '1 năm', 'Tất cả thời gian'];
const apiRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const editorialDetails: Plugin<'line'> = {
  id: 'finsight-details',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const styles = getComputedStyle(chart.canvas);
    ctx.save(); ctx.strokeStyle = styles.getPropertyValue('--chart-grid').trim() || '#444'; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    for (let row = 0; row < 4; row++) { const y = chartArea.top + (chartArea.height * row) / 3; ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke(); }
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const active = chart.getActiveElements()[0];
    const points = chart.getDatasetMeta(0).data;
    const point = points[active?.index ?? points.length - 1];
    if (!point) return;
    const styles = getComputedStyle(chart.canvas);
    ctx.save(); ctx.strokeStyle = styles.color;
    if (active) { ctx.globalAlpha = 0.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(point.x, chartArea.top); ctx.lineTo(point.x, chartArea.bottom); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = styles.color; ctx.fill(); ctx.strokeStyle = styles.getPropertyValue('--surface').trim() || '#faf9f6'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  },
};

export default function PriceChart({ index, stock, range, editorial = false }: { index: number; stock: Stock | undefined; range: number; editorial?: boolean }) {
  const { indices } = useAppData();
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart<'line', number[], number> | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [candles, setCandles] = useState<{ time: number; close: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedIndex = indices[index];
  const symbol = stock?.symbol || selectedIndex?.symbol || '';
  const isIndex = !stock;
  useEffect(() => {
    let active = true;
    if (!symbol) { setCandles([]); return () => { active = false; }; }
    setLoading(true); setError('');
    getCandles(symbol, apiRanges[range] || '1M', isIndex)
      .then((rows) => { if (active) setCandles(rows.map((row) => ({ time: row.time_unix_ms, close: Number(row.close) })).filter((row) => Number.isFinite(row.close) && row.time > 0)); })
      .catch((reason) => { if (active) { setCandles([]); setError(reason instanceof Error ? reason.message : 'Không tải được biểu đồ.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [symbol, range, isIndex]);

  const values = useMemo(() => candles.map((point) => point.close), [candles]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const axisLabels = useMemo(() => {
    if (!candles.length) return [];
    const positions = [0, Math.floor((candles.length - 1) * .25), Math.floor((candles.length - 1) * .5), Math.floor((candles.length - 1) * .75), candles.length - 1];
    return positions.map((position) => new Date(candles[position].time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
  }, [candles]);
  const active = Math.min(hover ?? Math.max(values.length - 1, 0), Math.max(values.length - 1, 0));
  const selectedTime = candles[active]?.time;
  const pointTime = selectedTime ? new Date(selectedTime).toLocaleString('vi-VN', { dateStyle: 'medium' }) : '';
  const negative = stock ? stock.change < 0 : (selectedIndex?.percent ?? 0) < 0;
  const chartMin = min === max ? min * .998 : min - (max - min) * .04;
  const chartMax = min === max ? max * 1.002 : max + (max - min) * .04;

  useEffect(() => {
    if (!canvas.current) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const instance = new Chart<'line', number[], number>(canvas.current, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 0, fill: 'start', tension: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: motion.matches ? false : { duration: 600, easing: 'easeOutQuart' },
        transitions: { active: { animation: { duration: motion.matches ? 0 : 160 } } },
        interaction: { mode: 'index', intersect: false, axis: 'x' },
        layout: { padding: { left: 8, right: 8, top: 28, bottom: 31 } },
        scales: { x: { type: 'linear', display: false, min: 0, max: 1 }, y: { type: 'linear', display: false } },
        onHover: (_event, elements) => setHover(elements[0]?.index ?? null),
      }, plugins: [editorialDetails],
    });
    chart.current = instance;
    const refresh = () => {
      const color = getComputedStyle(instance.canvas).color;
      instance.data.datasets[0].borderColor = color;
      instance.data.datasets[0].backgroundColor = (context) => {
        const { ctx, chartArea } = context.chart; if (!chartArea) return 'transparent';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `color-mix(in srgb, ${color} 14%, transparent)`); gradient.addColorStop(1, `color-mix(in srgb, ${color} 0.5%, transparent)`); return gradient;
      };
      instance.update('none');
    };
    const observer = new MutationObserver(refresh); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const updateMotion = () => { instance.options.animation = motion.matches ? false : { duration: 600, easing: 'easeOutQuart' }; instance.options.transitions = { active: { animation: { duration: motion.matches ? 0 : 160 } } }; instance.update('none'); };
    motion.addEventListener('change', updateMotion); document.fonts.ready.then(() => { if (chart.current === instance) refresh(); });
    return () => { observer.disconnect(); motion.removeEventListener('change', updateMotion); instance.destroy(); chart.current = null; };
  }, []);

  useEffect(() => {
    const instance = chart.current; if (!instance || !canvas.current) return;
    setHover(null); instance.setActiveElements([]); instance.data.labels = values.map((_, position) => position); instance.data.datasets[0].data = values;
    const color = getComputedStyle(canvas.current).color; instance.data.datasets[0].borderColor = color;
    instance.data.datasets[0].backgroundColor = (context) => {
      const { ctx, chartArea } = context.chart; if (!chartArea) return 'transparent';
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, `color-mix(in srgb, ${color} 14%, transparent)`); gradient.addColorStop(1, `color-mix(in srgb, ${color} 0.5%, transparent)`); return gradient;
    };
    if (instance.options.scales?.x) instance.options.scales.x.max = Math.max(values.length - 1, 1);
    if (instance.options.scales?.y && values.length) { instance.options.scales.y.min = chartMin; instance.options.scales.y.max = chartMax; }
    instance.update();
  }, [values, chartMin, chartMax]);

  const resetHover = () => { setHover(null); chart.current?.setActiveElements([]); chart.current?.update('none'); };
  return (
    <div className={editorial ? 'text-market-accent' : `chart-visual ${negative ? 'is-negative' : ''}`}>
      <div className={editorial ? 'relative pr-14' : 'chart-canvas'} onMouseLeave={resetHover} onTouchEnd={resetHover}>
        <div className={editorial ? 'relative h-[240px] w-full sm:h-[280px]' : 'chart-plot'}>
          <canvas ref={canvas} className="!h-full !w-full" role="img" aria-label={`Biểu đồ ${stock?.symbol || selectedIndex?.name || 'thị trường'}, ${rangeLabels[range]}, dữ liệu giá đã thu thập.`} />
          {values.length > 0 && hover !== null && <div className={editorial ? 'pointer-events-none absolute flex min-w-24 flex-col rounded-xs bg-ink px-3 py-2 text-[11px] text-primary [&>span]:text-[9px]' : 'chart-tooltip'} style={{ left: `clamp(0px, calc(${(active / Math.max(values.length - 1, 1)) * 100}% - 48px), calc(100% - 96px))`, top: '8px' }}><strong>{number(values[active], stock ? 0 : 2)}</strong><span>{pointTime}</span></div>}
          {!values.length && <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-foreground/60">{loading ? 'Đang tải lịch sử giá…' : error || 'Chưa có dữ liệu lịch sử cho khoảng thời gian này.'}</div>}
        </div>
        {values.length > 0 && <div className={editorial ? 'absolute inset-y-0 right-0 flex w-12 flex-col justify-between py-6 text-right text-[10px] text-foreground/60 tabular-nums' : 'chart-y-axis'} aria-hidden="true">{[0, 1, 2, 3].map((position) => <span key={position}>{number(chartMax - ((chartMax - chartMin) * position) / 3, stock ? 0 : 2)}</span>)}</div>}
      </div>
      {values.length > 0 && <div className={editorial ? 'mt-3 flex justify-between gap-1 pr-14 text-[9px] text-foreground/60 sm:text-[10px]' : 'chart-x-axis'}>{axisLabels.map((label, position) => <span key={`${position}-${label}`}>{label}</span>)}</div>}
      {values.length > 1 && <label className="sr-only">Xem từng điểm dữ liệu biểu đồ<input type="range" min={0} max={values.length - 1} value={active} onChange={(event) => { const position = Number(event.target.value); setHover(position); chart.current?.setActiveElements([{ datasetIndex: 0, index: position }]); chart.current?.update('none'); }} aria-valuetext={`${pointTime}: ${number(values[active], stock ? 0 : 2)}`} onBlur={resetHover} /></label>}
    </div>
  );
}

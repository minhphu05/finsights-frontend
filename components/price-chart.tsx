'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, Filler, type Plugin } from 'chart.js';
import { indices, number, type Stock } from '@/lib/data';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler);
const rangeLabels = ['1 ngày', '1 tuần', '1 tháng', '3 tháng', '1 năm', 'Tất cả thời gian'];

// Keep the original grid, crosshair and endpoint instead of Chart.js defaults.
const editorialDetails: Plugin<'line'> = {
  id: 'finsight-details',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const styles = getComputedStyle(chart.canvas);
    ctx.save();
    ctx.strokeStyle = styles.getPropertyValue('--chart-grid').trim() || '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    for (let row = 0; row < 4; row++) {
      const y = chartArea.top + (chartArea.height * row) / 3;
      ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
    }
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const active = chart.getActiveElements()[0];
    const points = chart.getDatasetMeta(0).data;
    const point = points[active?.index ?? points.length - 1];
    if (!point) return;
    const styles = getComputedStyle(chart.canvas);
    ctx.save();
    ctx.strokeStyle = styles.color;
    if (active) {
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(point.x, chartArea.top); ctx.lineTo(point.x, chartArea.bottom); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = styles.color; ctx.fill();
    ctx.strokeStyle = styles.getPropertyValue('--surface').trim() || '#faf9f6';
    ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  },
};

export default function PriceChart({ index, stock, range, editorial = false }: {
  index: number;
  stock: Stock | undefined;
  range: number;
  editorial?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart<'line', number[], number> | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const baseline = stock ? stock.price : indices[index].value;
  const negative = stock ? stock.change < 0 : indices[index].percent < 0;
  const values = useMemo(() => {
    const raw = Array.from({ length: 66 }, (_, i) => {
      const drift = (negative ? -1 : 1) * (i / 65) * 0.013;
      const wave = Math.sin(i * 0.8 + range) * 0.0015 + Math.sin(i * 0.27 + index) * 0.002 + Math.cos(i * 1.9) * 0.0008;
      return baseline * (0.987 + drift + wave + range * 0.0001);
    });
    const offset = baseline - raw[65];
    return raw.map(value => value + offset);
  }, [baseline, negative, range, index]);
  const min = Math.min(...values) - baseline * 0.002;
  const max = Math.max(...values) + baseline * 0.002;
  const active = hover ?? 65;
  const py = (value: number) => 210 - ((value - min) / (max - min)) * 183;
  const labels = range === 0 ? ['09:00', '10:00', '11:30', '13:00', '14:45']
    : range === 1 ? ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']
    : range < 4 ? ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Hiện tại']
    : ['Đầu kỳ', '¼ kỳ', 'Giữa kỳ', '¾ kỳ', 'Cuối kỳ'];
  const pointTime = range === 0
    ? `${String(9 + Math.floor((active / 65) * 5)).padStart(2, '0')}:${String(Math.round((active / 65) * 45)).padStart(2, '0')}`
    : `Điểm ${active + 1} / 66`;

  useEffect(() => {
    if (!canvas.current) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const instance = new Chart<'line', number[], number>(canvas.current, {
      type: 'line',
      data: { datasets: [{ data: [], borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 0, fill: 'start', tension: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: motion.matches ? false : { duration: 600, easing: 'easeOutQuart' },
        transitions: { active: { animation: { duration: motion.matches ? 0 : 160 } } },
        interaction: { mode: 'index', intersect: false, axis: 'x' },
        layout: { padding: { left: 8, right: 8, top: 28, bottom: 31 } },
        scales: {
          x: { type: 'linear', display: false, min: 0, max: 65 },
          y: { type: 'linear', display: false },
        },
        onHover: (_event, elements) => setHover(elements[0]?.index ?? null),
      },
      plugins: [editorialDetails],
    });
    chart.current = instance;
    const refresh = () => {
      const color = getComputedStyle(instance.canvas).color;
      const dataset = instance.data.datasets[0];
      dataset.borderColor = color;
      dataset.backgroundColor = context => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'transparent';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `color-mix(in srgb, ${color} 14%, transparent)`);
        gradient.addColorStop(1, `color-mix(in srgb, ${color} 0.5%, transparent)`);
        return gradient;
      };
      instance.update('none');
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const updateMotion = () => {
      instance.options.animation = motion.matches ? false : { duration: 600, easing: 'easeOutQuart' };
      instance.options.transitions = { active: { animation: { duration: motion.matches ? 0 : 160 } } };
      instance.update('none');
    };
    motion.addEventListener('change', updateMotion);
    document.fonts.ready.then(() => { if (chart.current === instance) refresh(); });
    return () => {
      observer.disconnect(); motion.removeEventListener('change', updateMotion);
      instance.destroy(); chart.current = null;
    };
  }, [editorial]);

  useEffect(() => {
    const instance = chart.current;
    if (!instance || !canvas.current) return;
    setHover(null);
    instance.setActiveElements([]);
    instance.data.labels = values.map((_, position) => position);
    instance.data.datasets[0].data = values;
    const color = getComputedStyle(canvas.current).color;
    instance.data.datasets[0].borderColor = color;
    instance.data.datasets[0].backgroundColor = context => {
      const { ctx, chartArea } = context.chart;
      if (!chartArea) return 'transparent';
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, `color-mix(in srgb, ${color} 14%, transparent)`);
      gradient.addColorStop(1, `color-mix(in srgb, ${color} 0.5%, transparent)`);
      return gradient;
    };
    if (instance.options.scales?.y) { instance.options.scales.y.min = min; instance.options.scales.y.max = max; }
    instance.update();
  }, [values, min, max, editorial]);

  const resetHover = () => {
    setHover(null);
    chart.current?.setActiveElements([]);
    chart.current?.update('none');
  };

  return (
    <div className={editorial ? 'text-market-accent' : `chart-visual ${negative ? 'is-negative' : ''}`}>
      <div className={editorial ? 'relative pr-14' : 'chart-canvas'} onMouseLeave={resetHover} onTouchEnd={resetHover}>
        <div className={editorial ? 'relative h-[240px] w-full sm:h-[280px]' : 'chart-plot'}>
          <canvas ref={canvas} className="!h-full !w-full" role="img" aria-label={`Biểu đồ ${stock?.symbol || indices[index].name}, khoảng thời gian ${rangeLabels[range]}. Dữ liệu minh họa.`}>
            {`Giá cuối kỳ: ${number(values[65], stock ? 0 : 2)}. Thấp nhất: ${number(Math.min(...values), stock ? 0 : 2)}. Cao nhất: ${number(Math.max(...values), stock ? 0 : 2)}.`}
          </canvas>
          {hover !== null && <div className={editorial ? 'pointer-events-none absolute flex min-w-24 flex-col rounded-xs bg-ink px-3 py-2 text-[11px] text-primary [&>span]:text-[9px]' : 'chart-tooltip'} style={{ left: `clamp(0px, calc(${(active / 65) * 100}% - 48px), calc(100% - 96px))`, top: `clamp(0px, calc(${(py(values[active]) / 240) * 100}% - 48px), calc(100% - 44px))` }}><strong>{number(values[active], stock ? 0 : 2)}</strong><span>{pointTime}</span></div>}
        </div>
        <div className={editorial ? 'absolute inset-y-0 right-0 flex w-12 flex-col justify-between py-6 text-right text-[10px] text-foreground/60 tabular-nums' : 'chart-y-axis'} aria-hidden="true">
          {[0, 1, 2, 3].map(position => <span key={position}>{number(max - ((max - min) * position) / 3, 0)}</span>)}
        </div>
      </div>
      <div className={editorial ? 'mt-3 flex justify-between gap-1 pr-14 text-[9px] text-foreground/60 sm:text-[10px]' : 'chart-x-axis'}>{labels.map(label => <span key={label}>{label}</span>)}</div>
      <label className="sr-only">Xem từng điểm dữ liệu biểu đồ<input type="range" min={0} max={65} value={active} onChange={event => { const position = Number(event.target.value); setHover(position); chart.current?.setActiveElements([{ datasetIndex: 0, index: position }]); chart.current?.update('none'); }} aria-valuetext={`${pointTime}: ${number(values[active], stock ? 0 : 2)}`} onBlur={resetHover} /></label>
    </div>
  );
}

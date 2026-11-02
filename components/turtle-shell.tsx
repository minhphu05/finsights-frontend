'use client';
import { useState } from 'react';
import { stocks, vn30, priceBands, priceTone, toneLabels, number, signed, type Tone } from '@/lib/data';
import { useWatch } from './shell';
const TONES: Tone[] = ['ceil', 'up', 'ref', 'down', 'floor'];
const IMG = { w: 1447, h: 1087 };
// Tâm 30 mảng màu trên ảnh rùa (pixel ảnh gốc), cùng thứ tự với rổ vn30: hàng 3-4-5-6-5-4-3 từ đầu xuống đuôi
const SCUTES: [number, number][] = [
  [593, 309], [719, 314], [844, 326],
  [540, 419], [652, 398], [783, 403], [910, 418],
  [495, 507], [595, 496], [719, 484], [851, 491], [950, 503],
  [469, 589], [566, 561], [666, 572], [786, 566], [898, 575], [982, 585],
  [522, 663], [626, 656], [734, 647], [840, 652], [941, 660],
  [582, 742], [695, 730], [799, 717], [885, 730],
  [645, 805], [748, 806], [834, 795],
];

export function TurtleTracks() {
  const marks = Array.from({ length: 44 }, (_, i) => {
    const x = 14 + i * 33,
      y = 70 + 24 * Math.sin((x / 1440) * Math.PI * 2.4),
      slope = ((24 * Math.PI * 2.4) / 1440) * Math.cos((x / 1440) * Math.PI * 2.4),
      len = Math.hypot(1, slope),
      nx = -slope / len,
      ny = 1 / len,
      tx = 1 / len,
      ty = slope / len;
    const print = (side: 1 | -1) => {
      const px = x + nx * 15 * side,
        py = y + ny * 15 * side;
      return `M ${px.toFixed(1)} ${py.toFixed(1)} l ${(nx * 7 * side - tx * 8).toFixed(1)} ${(ny * 7 * side - ty * 8).toFixed(1)}`;
    };
    return { d: `${print(1)} ${print(-1)}`, x, y };
  });
  return (
    <svg
      className="turtle-tracks reveal"
      viewBox="0 0 1440 140"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
    >
      <path
        className="track-drag"
        d={marks.map((m, i) => `${i ? 'L' : 'M'} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`).join(' ')}
      />
      {marks.map((m, i) => (
        <path key={i} className="track-print" d={m.d} style={{ '--i': i } as React.CSSProperties} />
      ))}
    </svg>
  );
}

export default function TurtleShell() {
  // Card chỉ dựng bố cục và nội dung (mã FPT làm mẫu); màu sắc để bước sau.
  const stock = stocks.find((s) => s.symbol === 'FPT')!;
  const bands = priceBands(stock);
  // Tab "Theo dõi": mã đang theo dõi sáng lên, các mã còn lại mờ đi
  const { watch } = useWatch();
  const [tab, setTab] = useState<'vn30' | 'watch'>('vn30');
  const watchCount = vn30.filter((s) => watch.includes(s)).length;
  // Độ rộng thị trường trên rổ VN30: đếm số mã theo từng màu giá (tăng gồm trần, giảm gồm sàn)
  const count = Object.fromEntries(TONES.map((t) => [t, 0])) as Record<Tone, number>;
  vn30.forEach((symbol) => count[priceTone(stocks.find((s) => s.symbol === symbol)!)]++);
  const rising = count.ceil + count.up,
    falling = count.down + count.floor;
  const mood =
    rising > falling
      ? 'Rùa thò đầu bò lên: phe tăng đang dẫn'
      : falling > rising
        ? 'Rùa rụt cổ nằm im: phe giảm lấn lướt'
        : 'Rùa đứng giữa ngã ba: hai phe ngang ngửa';
  return (
    <section className="turtle-hero turtle-only" aria-label="Rùa xanh, biểu tượng của thị trường">
      <div className="ink-frame turtle-frame">
        <div className="turtle-art">
          <img
            src="/images/rua-xanh.webp"
            alt="Rùa xanh nhìn từ trên xuống, bơi trong hồ"
            width={IMG.w}
            height={IMG.h}
            fetchPriority="high"
          />
          {vn30.map((symbol, i) => {
            const s = stocks.find((x) => x.symbol === symbol)!;
            const lit = tab === 'watch' && watch.includes(symbol);
            const dim = tab === 'watch' && !lit;
            return (
              <span
                key={symbol}
                className={`shell-label${lit ? ' is-lit' : ''}${dim ? ' is-dim' : ''}`}
                style={
                  {
                    left: `${(SCUTES[i][0] / IMG.w) * 100}%`,
                    top: `${(SCUTES[i][1] / IMG.h) * 100}%`,
                    '--i': i,
                  } as React.CSSProperties
                }
              >
                <b>{symbol}</b>
                <small>{signed(s.change)}%</small>
              </span>
            );
          })}
        </div>
        <div className="ink-frame turtle-tabs" role="tablist" aria-label="Chọn nhóm mã trên mai">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'vn30'}
            onClick={() => setTab('vn30')}
          >
            VN30
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'watch'}
            onClick={() => setTab('watch')}
          >
            Theo dõi <span>{watchCount}</span>
          </button>
        </div>
        <div className="shell-breadth">
          <div className="shell-breadth-bar">
            {TONES.filter((t) => count[t]).map((t) => (
              <span key={t} className={`bt-${t}`} style={{ flexGrow: count[t] }} />
            ))}
          </div>
          <div className="shell-breadth-meta">
            <p className="shell-breadth-counts">
              <b className="bt-up">
                {rising} tăng ({count.ceil} trần)
              </b>
              <b className="bt-ref">{count.ref} đứng giá</b>
              <b className="bt-down">
                {falling} giảm ({count.floor} sàn)
              </b>
            </p>
            <ul className="shell-breadth-legend" aria-label="Chú thích màu">
              {TONES.map((t) => (
                <li key={t} className={`bt-${t}`}>
                  <i />
                  {toneLabels[t]}
                </li>
              ))}
            </ul>
          </div>
          <p className="shell-breadth-mood">
            {mood} · Trên {vn30.length} mã VN30
          </p>
        </div>
      </div>
      <div className="ink-frame hero-card">
        <img
          className="hero-card-corner"
          src="/images/rua-xanh-goc-card.webp"
          alt=""
          aria-hidden="true"
          width={1385}
          height={1136}
        />
        <h1 id="hero-title">
          <span className="hero-line">
            <span>Cả thị trường</span>
          </span>{' '}
          <br />
          <span className="hero-line">
            <span>nằm trên lưng rùa.</span>
          </span>
        </h1>
        <p className="hero-card-lead">
          Mỗi mảng giáp trên lưng là một doanh nghiệp trong rổ VN30. Chọn một mảng để xem kỹ.
        </p>
        <div className="hero-card-body">
        <div className="hero-card-company">
          <strong>{stock.symbol}</strong>
          <small>{stock.exchange}</small>
          <span>{stock.name}</span>
        </div>
        <p className="hero-card-price">
          <span>{number(stock.price)}</span>
          <em>{signed(stock.change)}%</em>
        </p>
        <dl className="hero-card-bands">
          <div className="band-ceil">
            <dt>Trần</dt>
            <dd>{number(bands.ceil)}</dd>
          </div>
          <div className="band-ref">
            <dt>Tham chiếu</dt>
            <dd>{number(bands.ref)}</dd>
          </div>
          <div className="band-floor">
            <dt>Sàn</dt>
            <dd>{number(bands.floor)}</dd>
          </div>
        </dl>
        <dl className="hero-card-facts">
          <div>
            <dt>Ngành</dt>
            <dd>{stock.sector}</dd>
          </div>
          <div>
            <dt>Khối lượng</dt>
            <dd>{stock.volume}</dd>
          </div>
          <div>
            <dt>Vốn hóa</dt>
            <dd>{stock.cap} tỷ</dd>
          </div>
        </dl>
        <button type="button" className="ink-frame hero-card-button">
          Xem biểu đồ
          <svg className="btn-arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m9 5.5 6.5 6.5L9 18.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        </div>
      </div>
    </section>
  );
}

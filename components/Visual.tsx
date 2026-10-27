import type { Project, Visual as V } from '@/content/site';

// Small result charts for the Work rows, drawn from the numbers in content/site.json.
// Plain SVG in a 150 x 90 box (rendered ~1.2x, so 8.5px text reads at ~10px); they draw in once
// via the .viz-* classes when the row is revealed.

const W = 150;
const H = 90;
const minus = (s: string) => s.replace('-', '−');
const signed = (v: number) => (v > 0 ? `+${Math.round(v)}%` : minus(`${Math.round(v)}%`));
const vars = (o: Record<string, string | number>) => o as React.CSSProperties;
const box = { viewBox: `0 0 ${W} ${H}`, className: 'viz block h-auto w-full overflow-visible', role: 'img' } as const;

function Slope({ v }: { v: Extract<V, { type: 'slope' }> }) {
  const x1 = 30, x2 = 116, lo = -0.3, hi = 1.8, top = 6, bot = 74;
  const y = (s: number) => bot - ((s - lo) / (hi - lo)) * (bot - top);
  const best = v.pairs.reduce((a, b) => (b[0] > a[0] ? b : a));
  const label = `${v.label}, from ${v.from.toLowerCase()} to ${v.to.toLowerCase()}: the best fell from ${best[0].toFixed(2)} to ${best[1].toFixed(2)}.`;
  return (
    <svg {...box} aria-label={label}>
      <path className="v-axis" d={`M${x1} ${top}V${bot}M${x2} ${top}V${bot}`} />
      <path className="v-ref" d={`M${x1} ${y(0)}H${x2}`} />
      <text x={x1 - 5} y={y(0) + 3} textAnchor="end">0</text>
      {v.pairs.map(([a, b], i) => {
        const top1 = a === best[0];
        return (
          <path
            key={i}
            className="v-line viz-draw"
            pathLength={1}
            style={vars({ '--i': i })}
            d={`M${x1} ${y(a).toFixed(1)}L${x2} ${y(b).toFixed(1)}`}
            strokeWidth={top1 ? 1.6 : 1}
            opacity={top1 ? 1 : 0.4}
          />
        );
      })}
      <circle className="v-accent viz-fade" cx={x1} cy={y(best[0])} r={2.2} />
      <circle className="v-accent viz-fade" cx={x2} cy={y(best[1])} r={2.2} />
      <text className="v-strong viz-fade" x={x1 - 5} y={y(best[0]) + 3} textAnchor="end">{best[0].toFixed(2)}</text>
      <text className="v-strong viz-fade" x={x2 + 5} y={y(best[1]) + 3}>{minus(best[1].toFixed(2))}</text>
      <text x={x1} y={88} textAnchor="middle">{v.from}</text>
      <text x={x2} y={88} textAnchor="middle">{v.to}</text>
    </svg>
  );
}

function Bars({ v }: { v: Extract<V, { type: 'bars' }> }) {
  const top = 14, bot = 74, bw = 30;
  const y = (p: number) => bot - (p / 100) * (bot - top);
  const cxs = [W * 0.3, W * 0.7]; // two bars, set apart so their labels never touch
  const label = `${v.label}: ${v.items.map((it) => `${it.label.toLowerCase()} ${Math.round(it.value)}%`).join(', ')}.`;
  return (
    <svg {...box} aria-label={label}>
      {v.items.map((it, i) => {
        const cx = cxs[i] ?? (W / (v.items.length + 1)) * (i + 1);
        return (
          <g key={it.label}>
            <rect
              className={`viz-grow ${i === 0 ? 'v-accent' : 'v-dim'}`}
              style={vars({ '--i': i })}
              x={cx - bw / 2}
              y={y(it.value)}
              width={bw}
              height={bot - y(it.value)}
              rx={2}
            />
            <text className="v-strong viz-fade" style={vars({ '--i': i })} x={cx} y={y(it.value) - 5} textAnchor="middle">
              {Math.round(it.value)}%
            </text>
            <text x={cx} y={88} textAnchor="middle">{it.label}</text>
          </g>
        );
      })}
      <path className="v-axis" d={`M12 ${bot}H${W - 12}`} />
    </svg>
  );
}

function Paired({ v }: { v: Extract<V, { type: 'paired' }> }) {
  const x0 = 50, k = 0.9, bh = 7;
  const label = v.rows.map((r) => `${r.label}: ${v.series[0]} ${signed(r.values[0])}, ${v.series[1]} ${signed(r.values[1])}`).join('. ');
  return (
    <svg {...box} aria-label={`${label}.`}>
      {v.rows.map((r, ri) => {
        const y0 = ri * 36;
        return (
          <g key={r.label}>
            <text x={0} y={y0 + 7}>{r.label}</text>
            <path className="v-axis" d={`M${x0} ${y0 + 9}V${y0 + 30}`} />
            {r.values.map((val, si) => {
              const w = Math.abs(val) * k;
              const x = val >= 0 ? x0 : x0 - w;
              const yy = y0 + 11 + si * 10;
              return (
                <g key={si}>
                  <rect
                    className={`viz-grow ${si === 0 ? 'v-accent' : 'v-dim'}`}
                    style={vars({ '--i': ri * 2 + si, '--sx': 0, '--sy': 1, '--origin': val >= 0 ? 'left' : 'right' })}
                    x={x}
                    y={yy}
                    width={w}
                    height={bh}
                    rx={1.5}
                  />
                  <text
                    className="v-strong viz-fade"
                    style={vars({ '--i': ri * 2 + si })}
                    x={val >= 0 ? x0 + w + 4 : x0 - w - 4}
                    y={yy + 6}
                    textAnchor={val >= 0 ? 'start' : 'end'}
                  >
                    {signed(val)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <rect className="v-accent" x={0} y={81} width={6} height={6} rx={1} />
      <text x={9} y={87}>{v.series[0]}</text>
      <rect className="v-dim" x={54} y={81} width={6} height={6} rx={1} />
      <text x={63} y={87}>{v.series[1]}</text>
    </svg>
  );
}

function Interval({ v }: { v: Extract<V, { type: 'interval' }> }) {
  const lo = 0.85, hi = 1.25, xa = 42, xb = 116;
  const x = (s: number) => xa + ((s - lo) / (hi - lo)) * (xb - xa);
  const label = `${v.label}: ${v.items.map((it) => `${it.label} ${it.value}`).join(', ')}; ${v.ref} is ${v.refLabel}.`;
  return (
    <svg {...box} aria-label={label}>
      <path className="v-ref" d={`M${x(v.ref)} 2V66`} />
      {v.items.map((it, i) => {
        const y = 12 + i * 22;
        const a = x(it.value - 1.96 * it.se), b = x(it.value + 1.96 * it.se);
        return (
          <g key={it.label}>
            <text x={0} y={y + 3}>{it.label}</text>
            <path className="v-line viz-draw" pathLength={1} style={vars({ '--i': i * 2 })} d={`M${a.toFixed(1)} ${y}H${b.toFixed(1)}`} strokeWidth={1.2} />
            <path className="v-line viz-fade" style={vars({ '--i': i * 2 })} d={`M${a.toFixed(1)} ${y - 3}v6M${b.toFixed(1)} ${y - 3}v6`} strokeWidth={1.2} />
            <circle className="v-accent viz-fade" style={vars({ '--i': i * 2 })} cx={x(it.value)} cy={y} r={2.6} />
            <text className="v-strong viz-fade" style={vars({ '--i': i * 2 })} x={b + 5} y={y + 3}>{it.value.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={x(v.ref)} y={84} textAnchor="middle">{`${v.ref.toFixed(1)} = ${v.refLabel}`}</text>
    </svg>
  );
}

const tile = 'rounded-md border border-stroke bg-tile transition-colors duration-200 lg:group-hover:border-stroke-strong';

export function Visual({ p }: { p: Project }) {
  const v = p.visual;

  if (v.type === 'status') {
    return (
      <div className={`${tile} flex aspect-[5/3] flex-col justify-between p-4`}>
        <span className="label flex items-center gap-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Status
        </span>
        <div>
          <p className="display text-xl leading-tight text-text">{p.figure}</p>
          <p className="mt-1 text-xs leading-snug text-muted">{p.figureCaption}</p>
        </div>
      </div>
    );
  }

  const caption = (
    <div className="mt-2.5">
      <p className="text-sm font-semibold text-text tabular-nums">{p.figure}</p>
      <p className="text-xs leading-snug text-muted">{p.figureCaption}</p>
    </div>
  );

  if (v.type === 'image') {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static file, images are served unoptimised */}
        <img src={v.src} alt={v.alt} width={v.width} height={v.height} loading="lazy" decoding="async" className={`${tile} aspect-[8/5] w-full object-cover object-left-top`} />
        {caption}
      </div>
    );
  }

  return (
    <div>
      <figure className={`${tile} px-3 pb-2.5 pt-3`}>
        <figcaption className="label mb-2 normal-case tracking-[0.04em]">{v.label}</figcaption>
        {v.type === 'slope' && <Slope v={v} />}
        {v.type === 'bars' && <Bars v={v} />}
        {v.type === 'paired' && <Paired v={v} />}
        {v.type === 'interval' && <Interval v={v} />}
      </figure>
      {caption}
    </div>
  );
}

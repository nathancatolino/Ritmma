/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DailyLog } from '../types';
import { Band } from '../data';
import { fmtDate, linregSlope } from '../utils';

// ESCAPE XML HELPER
const esc = (s: any) => String(s == null ? '' : s);

// MULTI-LINE TREND CHART
export interface SeriesItem {
  name: string;
  color: string;
  data: (number | null | undefined)[];
}

export const Legend: React.FC<{ series: { name: string; color: string }[] }> = ({ series }) => {
  return (
    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
      {series.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
};

// HELPER FOR SMOOTH CUBIC BEZIER CURVES (MAPA RITMMA)
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export const MultiLineChart: React.FC<{ series: SeriesItem[]; max?: number }> = ({ series, max = 10 }) => {
  let n = 0;
  series.forEach((s) => {
    n = Math.max(n, s.data.length);
  });

  if (n < 2) {
    return <div className="text-center py-8 text-xs text-slate-400">Dados insuficientes para gerar a evolução.</div>;
  }

  const W = 580;
  const H = 160;
  const P = 30;

  const xs = (i: number) => P + (n > 1 ? (i * (W - P * 2)) / (n - 1) : 0);
  const ys = (v: number) => P + (H - P * 2) * (1 - v / max);

  const gridValues = [0, max / 2, max];

  return (
    <div className="overflow-x-auto w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
        {/* Grid lines */}
        {gridValues.map((g, idx) => (
          <g key={idx}>
            <line
              x1={P}
              y1={ys(g)}
              x2={W - P}
              y2={ys(g)}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeDasharray="3"
            />
            <text
              x={P - 6}
              y={ys(g) + 3}
              fill="currentColor"
              className="text-slate-400 dark:text-slate-500 font-mono"
              fontSize="9"
              textAnchor="end"
            >
              {g}
            </text>
          </g>
        ))}

        {/* Paths */}
        {series.map((s, sIdx) => {
          const points: { x: number; y: number; val: number }[] = [];
          s.data.forEach((v, i) => {
            if (v != null && !isNaN(v)) {
              points.push({ x: xs(i), y: ys(Number(v)), val: Number(v) });
            }
          });

          if (points.length < 2) return null;

          const pathD = getSmoothPath(points);

          return (
            <g key={sIdx}>
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {points.map((pt, k) => (
                <circle
                  key={k}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// SINGLE SERIES LINE CHART
export const LineChart: React.FC<{ logs: DailyLog[]; field: keyof DailyLog; color: string; max?: number }> = ({
  logs,
  field,
  color,
  max = 10
}) => {
  const n = logs.length;
  const idx: number[] = [];
  const vals: number[] = [];

  logs.forEach((l, i) => {
    const v = l[field];
    if (v != null && typeof v === 'number' && !isNaN(v)) {
      idx.push(i);
      vals.push(v);
    }
  });

  if (vals.length < 2) {
    return <div className="text-center py-6 text-xs text-slate-400">Dados insuficientes para gerar o gráfico.</div>;
  }

  const W = 580;
  const H = 110;
  const P = 28;

  const xs = (i: number) => P + (n > 1 ? (i * (W - P * 2)) / (n - 1) : 0);
  const ys = (v: number) => P + (H - P * 2) * (1 - v / max);

  const pointsAttr = idx.map((i, k) => `${xs(i)},${ys(vals[k])}`).join(' ');

  return (
    <div className="overflow-x-auto w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
        {/* Grid lines */}
        {[0, max / 2, max].map((g, idxGr) => (
          <g key={idxGr}>
            <line
              x1={P}
              y1={ys(g)}
              x2={W - P}
              y2={ys(g)}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray="3"
            />
            <text
              x={P - 6}
              y={ys(g) + 3}
              fill="currentColor"
              className="text-slate-400 dark:text-slate-500"
              fontSize="9"
              textAnchor="end"
            >
              {g}
            </text>
          </g>
        ))}

        {/* Polyline */}
        <polyline
          points={pointsAttr}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {idx.map((i, k) => (
          <g key={k}>
            <circle cx={xs(i)} cy={ys(vals[k])} r="3" fill={color} />
            <title>{`${logs[i].date}: ${vals[k]}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// HORIZONTAL BAR CHART (for signed values like trigger delta or generic stats)
export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export const BarChart: React.FC<{
  items: BarChartItem[];
  signed?: boolean;
  labelW?: number;
  minScale?: number;
}> = ({ items, signed = false, labelW = 150, minScale = 1 }) => {
  if (!items.length) {
    return <div className="text-center py-6 text-xs text-slate-400">Sem dados.</div>;
  }

  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), minScale);
  const rowH = 26;
  const W = 580;
  const H = items.length * rowH + 10;
  const zeroX = signed ? labelW + (W - labelW - 20) / 2 : labelW;
  const fullW = signed ? (W - labelW - 20) / 2 : W - labelW - 20;

  return (
    <div className="overflow-x-auto w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
        {signed && (
          <line
            x1={zeroX}
            y1={0}
            x2={zeroX}
            y2={H}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
          />
        )}

        {items.map((it, k) => {
          const y = k * rowH + 5;
          const w = (Math.abs(it.value) / maxAbs) * fullW;
          const col = it.color || (it.value >= 0 ? '#f43f5e' : '#10b981');
          const x = signed ? (it.value >= 0 ? zeroX : zeroX - w) : labelW;
          const valTxt = (it.value > 0 && signed ? '+' : '') + (Math.round(it.value * 10) / 10).toFixed(1);

          return (
            <g key={k}>
              {/* Label */}
              <text
                x={labelW - 6}
                y={y + rowH / 2}
                fill="currentColor"
                className="text-slate-700 dark:text-slate-300 font-medium"
                fontSize="11"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {esc(it.label)}
              </text>

              {/* Bar */}
              <rect x={x} y={y + 4} width={Math.max(1, w)} height={rowH - 12} rx="3" fill={col} />

              {/* Value Text */}
              <text
                x={signed ? (it.value >= 0 ? x + w + 4 : x - 4) : labelW + w + 4}
                y={y + rowH / 2}
                fill="currentColor"
                className="text-slate-400 dark:text-slate-500 font-semibold"
                fontSize="10"
                textAnchor={signed && it.value < 0 ? 'end' : 'start'}
                dominantBaseline="middle"
              >
                {valTxt}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// DONUT CHART
export interface DonutItem {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{ items: DonutItem[]; center?: string | number }> = ({ items, center }) => {
  const total = items.reduce((a, b) => a + b.value, 0);

  if (!total) {
    return <div className="text-center py-6 text-xs text-slate-400">Sem dados para exibição do gráfico.</div>;
  }

  const cx = 70;
  const cy = 70;
  const r = 52;
  const sw = 18;
  const circ = 2 * Math.PI * r;
  let off = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
      <div className="w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full block">
          {items.map((it, idx) => {
            const frac = it.value / total;
            const len = frac * circ;
            const strokeDashOffset = -off;
            off += len;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={it.color}
                strokeWidth={sw}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={strokeDashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
          <text
            x={cx}
            y={cy}
            fill="currentColor"
            className="text-slate-800 dark:text-slate-100 font-bold"
            fontSize="16"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {center != null ? center : total}
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: it.color }} />
            <span>
              {it.label}: <strong>{it.value}</strong> ({Math.round((it.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// PROGRESS RING
export const ProgressRing: React.FC<{ pct: number; label?: string }> = ({ pct, label }) => {
  const r = 42;
  const c = 2 * Math.PI * r;
  const boundedPct = Math.max(0, Math.min(100, pct));
  const fill = (c * boundedPct) / 100;
  const col = boundedPct >= 70 ? '#10b981' : boundedPct >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex justify-center py-2">
      <div className="w-28 h-28">
        <svg viewBox="0 0 110 110" className="w-full h-full block">
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="8"
          />
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke={col}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${c - fill}`}
            transform="rotate(-90 55 55)"
            className="transition-all duration-500 ease-out"
          />
          <text
            x="55"
            y="52"
            fill="currentColor"
            className="text-slate-800 dark:text-slate-100 font-bold"
            fontSize="18"
            textAnchor="middle"
          >
            {Math.round(boundedPct)}%
          </text>
          {label && (
            <text
              x="55"
              y="68"
              fill="currentColor"
              className="text-slate-400 dark:text-slate-500"
              fontSize="8"
              fontWeight="500"
              textAnchor="middle"
            >
              {esc(label)}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

// SCATTER PLOT WITH TRENDLINE
export interface ScatterPoint {
  x: number;
  y: number;
}

export const ScatterPlot: React.FC<{
  points: ScatterPoint[];
  color?: string;
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
}> = ({ points, color = '#3b82f6', xmin, xmax, ymin = 0, ymax = 10 }) => {
  const validPoints = points.filter((p) => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y));

  if (validPoints.length < 2) {
    return <div className="text-center py-6 text-xs text-slate-400">Dados insuficientes para gerar a correlação.</div>;
  }

  const W = 560;
  const H = 160;
  const P = 34;

  const xsAll = validPoints.map((p) => p.x);
  const ysAll = validPoints.map((p) => p.y);

  const realXmin = xmin != null ? xmin : Math.min(...xsAll);
  const realXmax = xmax != null ? xmax : Math.max(...xsAll);
  const rangeX = realXmax === realXmin ? 1.0 : realXmax - realXmin;

  const xs = (v: number) => P + ((v - realXmin) / rangeX) * (W - P * 2);
  const ys = (v: number) => P + (1 - (v - ymin) / (ymax - ymin)) * (H - P * 2);

  // Compute trendline slope
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  const n = validPoints.length;
  validPoints.forEach((p) => {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sxx += p.x * p.x;
  });

  const dd = n * sxx - sx * sx;
  const slope = dd ? (n * sxy - sx * sy) / dd : 0;
  const icpt = (sy - slope * sx) / n;

  return (
    <div className="overflow-x-auto w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
        {/* Axes */}
        <line
          x1={P}
          y1={H - P}
          x2={W - P}
          y2={H - P}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-600"
          strokeWidth="1"
        />
        <line
          x1={P}
          y1={P}
          x2={P}
          y2={H - P}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-600"
          strokeWidth="1"
        />

        {/* Trendline */}
        <line
          x1={xs(realXmin)}
          y1={ys(slope * realXmin + icpt)}
          x2={xs(realXmax)}
          y2={ys(slope * realXmax + icpt)}
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4"
        />

        {/* Points */}
        {validPoints.map((p, idx) => (
          <circle key={idx} cx={xs(p.x)} cy={ys(p.y)} r="3.5" fill={color} opacity="0.65" />
        ))}

        {/* Axis Labels */}
        <text x={P - 6} y={ys(ymax) + 3} fill="#94a3b8" fontSize="8" textAnchor="end">
          {ymax}
        </text>
        <text x={P - 6} y={ys(ymin)} fill="#94a3b8" fontSize="8" textAnchor="end">
          {ymin}
        </text>
        <text x={P} y={H - 6} fill="#94a3b8" fontSize="8" textAnchor="start">
          {Math.round(realXmin)}
        </text>
        <text x={W - P} y={H - 6} fill="#94a3b8" fontSize="8" textAnchor="end">
          {Math.round(realXmax)}
        </text>
      </svg>
    </div>
  );
};

// CALENDAR HEATMAP (past 12 weeks of pain)
export const CalendarHeatmap: React.FC<{ logs: DailyLog[]; field: keyof DailyLog; max?: number }> = ({
  logs,
  field,
  max = 10
}) => {
  const byDate: Record<string, number> = {};
  logs.forEach((l) => {
    const val = l[field];
    if (val != null && typeof val === 'number') byDate[l.date] = val;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 7 * 11 - today.getDay());

  const cell = 10;
  const gap = 2;
  const weeks: { iso: string; v: number | null }[][] = [];

  let cur = new Date(start);
  while (cur <= today) {
    if (cur.getDay() === 0) {
      weeks.push([]);
    }
    const iso = cur.toISOString().split('T')[0];
    const v = byDate[iso] !== undefined ? byDate[iso] : null;
    weeks[weeks.length - 1].push({ iso, v });
    cur.setDate(cur.getDate() + 1);
  }

  const W = weeks.length * (cell + gap) + 24;
  const H = 7 * (cell + gap) + 10;

  const getColor = (v: number | null) => {
    if (v == null) return '#f1f5f9'; // Very light slate gray
    const t = v / max;
    if (t < 0.34) return '#a7f3d0'; // Soft pastel green
    if (t < 0.67) return '#fde68a'; // Soft pastel amber
    return '#fecdd3'; // Soft pastel rose
  };

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="overflow-x-auto w-full py-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg h-auto block select-none mx-auto">
        {/* Day-of-week labels */}
        {daysOfWeek.map((dn, i) => (
          <text
            key={i}
            x="16"
            y={5 + i * (cell + gap) + cell - 2}
            fill="#94a3b8"
            fontSize="7"
            fontWeight="500"
            textAnchor="end"
          >
            {dn}
          </text>
        ))}

        {/* Heatmap cells */}
        {weeks.map((wk, wi) =>
          wk.map((d, di) => {
            const dow = new Date(d.iso + 'T00:00:00').getDay();
            return (
              <rect
                key={`${wi}-${di}`}
                x={20 + wi * (cell + gap)}
                y={5 + dow * (cell + gap)}
                width={cell}
                height={cell}
                rx="2"
                fill={getColor(d.v)}
                className="transition-colors"
              >
                <title>{`${d.iso}${d.v != null ? `: ${d.v}` : ''}`}</title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
};

// CLINICAL BAND TIMELINE (for periodic metric histories)
export interface BandPoint {
  date: string;
  score: number;
}

export const BandLineChart: React.FC<{ points: BandPoint[]; bands: Band[]; max: number }> = ({
  points,
  bands,
  max
}) => {
  if (!points || points.length < 1) {
    return <div className="text-center py-6 text-xs text-slate-400">Sem avaliações ainda.</div>;
  }

  const W = 580;
  const H = 140;
  const P = 34;
  const n = points.length;

  const ys = (v: number) => P + (H - P * 2) * (1 - v / max);
  const xs = (i: number) => P + (n > 1 ? (i * (W - P * 2)) / (n - 1) : (W - P * 2) / 2);

  let prev = 0;

  return (
    <div className="overflow-x-auto w-full">
      <svg viewBox={`0 0 ${W + 30} ${H}`} className="w-full h-auto block select-none">
        {/* Severity bands background */}
        {bands.map((b, idx) => {
          const y1 = ys(b.upTo);
          const y0 = ys(prev);
          prev = b.upTo;

          return (
            <rect
              key={idx}
              x={P}
              y={y1}
              width={W - P * 2}
              height={Math.max(1, y0 - y1)}
              fill={b.color}
              opacity="0.12"
            />
          );
        })}

        {/* Timeline curve */}
        {n > 1 && (
          <polyline
            points={points.map((p, i) => `${xs(i)},${ys(p.score)}`).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-slate-700 dark:text-slate-300"
            strokeWidth="2"
          />
        )}

        {/* Dots and score readouts */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xs(i)}
              cy={ys(p.score)}
              r="3.5"
              fill="currentColor"
              className="text-slate-700 dark:text-slate-300"
            />
            <text
              x={xs(i)}
              y={ys(p.score) - 8}
              fill="currentColor"
              className="text-slate-800 dark:text-slate-100 font-bold"
              fontSize="9"
              textAnchor="middle"
            >
              {p.score}
            </text>
            <text
              x={xs(i)}
              y={H - 12}
              fill="currentColor"
              className="text-slate-400 dark:text-slate-500 font-medium"
              fontSize="7"
              textAnchor="middle"
            >
              {fmtDate(p.date, 's')}
            </text>
          </g>
        ))}

        {/* Band tags on the right */}
        {(() => {
          let lastPrev = 0;
          return bands.map((b, k) => {
            const prevUp = lastPrev;
            lastPrev = b.upTo;
            const ym = ys((prevUp + b.upTo) / 2);

            return (
              <text
                key={k}
                x={W - P + 4}
                y={ym + 3}
                fill={b.color}
                className="font-bold uppercase tracking-wider"
                fontSize="7"
                textAnchor="start"
              >
                {b.label}
              </text>
            );
          });
        })()}
      </svg>
    </div>
  );
};

// MINI CLINICAL ROSTER SPARKLINE
export const Sparkline: React.FC<{ values: (number | null | undefined)[]; color?: string; w?: number; h?: number }> = ({
  values,
  color = '#f43f5e',
  w = 90,
  h = 26
}) => {
  const vals = values.map(Number).filter((v) => v != null && !isNaN(v));

  if (vals.length < 2) {
    return (
      <svg width={w} height={h} className="block overflow-visible">
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#cbd5e1" strokeDasharray="3" />
      </svg>
    );
  }

  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const r = mx === mn ? 1.0 : mx - mn;

  const pts = values
    .map((v, i) => {
      if (v == null || isNaN(v)) return null;
      const x = (i * (w - 2)) / (values.length - 1) + 1;
      const y = h - 2 - ((v - mn) / r) * (h - 4);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <svg width={w} height={h} className="block overflow-visible select-none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

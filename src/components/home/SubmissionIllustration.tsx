'use client';

/* ------------------------------------------------------------------ */
/* Illustrated placeholder for a catch submission photo: the fish on a */
/* measuring board, mouth against the bump stop, with the angler's     */
/* hand holding it down and the tournament code written on the back    */
/* of the hand. Used until real submission photos are available.       */
/* ------------------------------------------------------------------ */

import { useId, type ReactElement } from 'react';

export type FishLook = 'largemouth' | 'smallmouth' | 'striped';

const PALETTES: Record<FishLook, { top: string; mid: string; belly: string; dark: string }> = {
  largemouth: { top: '#56692C', mid: '#A3AE62', belly: '#F1EBC8', dark: '#2A3413' },
  smallmouth: { top: '#6A4E1F', mid: '#B38B44', belly: '#F0DFB4', dark: '#3A2A0E' },
  striped: { top: '#566676', mid: '#B4C0CB', belly: '#F3F6F8', dark: '#2A343F' },
};

const W = 800;
const H = 600;
const PX = 24; // pixels per inch on the board
const X0 = 86; // zero line (face of the bump stop)
const BY = 250; // board top
const BH = 190; // board height

export default function SubmissionIllustration({
  look, code, inches, className = '',
}: {
  look: FishLook;
  code: string;
  inches: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const { top, mid, belly, dark } = PALETTES[look];

  // Fish geometry (mouth touches the bump stop, tail ends at `inches`)
  const L = inches * PX;
  const cx = X0;
  const cy = BY + BH / 2 + 4;
  const tail = cx + L;
  const bodyEnd = tail - 0.17 * L;
  const h = (0.3 * L) / 2;
  const body =
    `M${cx},${cy - 0.1 * h} ` +
    `C${cx + 0.06 * L},${cy - 0.75 * h} ${cx + 0.3 * L},${cy - 1.05 * h} ${cx + 0.52 * L},${cy - 0.95 * h} ` +
    `C${cx + 0.68 * L},${cy - 0.85 * h} ${bodyEnd - 0.02 * L},${cy - 0.35 * h} ${bodyEnd},${cy - 0.18 * h} ` +
    `L${bodyEnd},${cy + 0.18 * h} ` +
    `C${bodyEnd - 0.02 * L},${cy + 0.35 * h} ${cx + 0.66 * L},${cy + 0.8 * h} ${cx + 0.5 * L},${cy + 0.88 * h} ` +
    `C${cx + 0.3 * L},${cy + 0.98 * h} ${cx + 0.08 * L},${cy + 0.7 * h} ${cx},${cy + 0.22 * h} Z`;
  const fin = { stroke: dark, strokeOpacity: 0.5, strokeWidth: 2 };

  // Board ticks: inch / half / quarter, numbers every 2"
  const ticks: ReactElement[] = [];
  for (let q = 0; ; q++) {
    const x = X0 + (q * PX) / 4;
    if (x > 772) break;
    const len = q % 4 === 0 ? 30 : q % 2 === 0 ? 19 : 11;
    ticks.push(<rect key={`t${q}`} x={x - 1} y={BY} width={2} height={len} fill="#1B1B1B" />);
    ticks.push(<rect key={`b${q}`} x={x - 1} y={BY + BH - len} width={2} height={len} fill="#1B1B1B" />);
    if (q % 8 === 0 && q > 0) {
      ticks.push(
        <text key={`n${q}`} x={x} y={BY + 50} fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={18} textAnchor="middle" fill="#1B1B1B">{q / 4}</text>,
      );
    }
  }

  // Hand position (pressing on the middle of the fish, arm from lower right)
  const hx = cx + 0.52 * L;
  const hy = cy + 0.05 * h;
  const rot = `rotate(-18 ${hx + 70} ${hy})`;
  const skin = '#E2AE89';
  const skinEdge = '#B97E59';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Catch submission: ${inches}" fish on a measuring board, tournament code ${code} on the angler's hand`}>
      <defs>
        <pattern id={id('carpet')} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#2C3642" />
          <path d="M0 8L8 0" stroke="#34404D" strokeWidth="2" />
        </pattern>
        <linearGradient id={id('board')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6CF45" />
          <stop offset="1" stopColor="#E8B92A" />
        </linearGradient>
        <linearGradient id={id('fish')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".55" stopColor={mid} />
          <stop offset="1" stopColor={belly} />
        </linearGradient>
        <filter id={id('sh')} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#000" floodOpacity=".35" />
        </filter>
        <clipPath id={id('body')}><path d={body} /></clipPath>
      </defs>

      {/* Boat deck */}
      <rect width={W} height={H} fill={`url(#${id('carpet')})`} />

      {/* Measuring board + bump stop */}
      <rect x="40" y={BY} width="740" height={BH} rx="10" fill={`url(#${id('board')})`} filter={`url(#${id('sh')})`} />
      <rect x="40" y={BY - 26} width={X0 - 40} height={BH + 52} rx="8" fill="#1F2B38" filter={`url(#${id('sh')})`} />
      {ticks}

      {/* Fish: tail, fins, body, markings, head */}
      <path d={`M${bodyEnd - 4},${cy - 0.12 * h} L${tail},${cy - 0.85 * h} Q${tail - 0.04 * L},${cy} ${tail},${cy + 0.85 * h} L${bodyEnd - 4},${cy + 0.12 * h} Z`} fill={top} {...fin} />
      <path d={`M${cx + 0.22 * L},${cy - 0.98 * h} L${cx + 0.27 * L},${cy - 1.45 * h} L${cx + 0.33 * L},${cy - 1.35 * h} L${cx + 0.4 * L},${cy - 1.42 * h} L${cx + 0.46 * L},${cy - h} Z`} fill={top} {...fin} />
      <path d={`M${cx + 0.48 * L},${cy - 0.98 * h} Q${cx + 0.56 * L},${cy - 1.5 * h} ${cx + 0.68 * L},${cy - 0.72 * h} Z`} fill={top} {...fin} />
      <path d={`M${cx + 0.56 * L},${cy + 0.85 * h} Q${cx + 0.62 * L},${cy + 1.3 * h} ${cx + 0.7 * L},${cy + 0.68 * h} Z`} fill={mid} {...fin} />
      <path d={`M${cx + 0.26 * L},${cy + 0.95 * h} Q${cx + 0.3 * L},${cy + 1.35 * h} ${cx + 0.36 * L},${cy + 0.92 * h} Z`} fill={mid} {...fin} />
      <path d={body} fill={`url(#${id('fish')})`} stroke={dark} strokeOpacity={0.55} strokeWidth={2.5} />
      <g clipPath={`url(#${id('body')})`}>
        {look === 'largemouth' && (
          <polyline
            points={[0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8].map((t, i) => `${cx + t * L},${cy - 0.12 * h + (i % 2 ? 8 : -6)}`).join(' ')}
            fill="none" stroke={dark} strokeOpacity={0.55} strokeWidth={0.11 * h} strokeLinejoin="round" strokeLinecap="round"
          />
        )}
        {look === 'smallmouth' &&
          [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78].map((t) => (
            <rect key={t} x={cx + t * L} y={cy - h} width={0.035 * L} height={1.5 * h} rx={6} fill={dark} opacity={0.28} />
          ))}
        {look === 'striped' &&
          [-0.55, -0.32, -0.1, 0.12, 0.34].map((k) => (
            <path key={k} d={`M${cx + 0.15 * L},${cy + k * h} L${bodyEnd},${cy + k * h * 0.6}`} stroke={dark} strokeOpacity={0.55} strokeWidth={0.05 * h} strokeLinecap="round" />
          ))}
      </g>
      <path d={`M${cx + 0.2 * L},${cy - 0.72 * h} Q${cx + 0.15 * L},${cy} ${cx + 0.21 * L},${cy + 0.72 * h}`} fill="none" stroke={dark} strokeOpacity={0.6} strokeWidth={3} />
      <circle cx={cx + 0.085 * L} cy={cy - 0.35 * h} r={0.11 * h} fill="#F3E3A0" stroke={dark} strokeWidth={2} />
      <circle cx={cx + 0.087 * L} cy={cy - 0.35 * h} r={0.055 * h} fill="#111" />
      <path d={`M${cx},${cy + 0.05 * h} L${cx + 0.12 * L},${cy + 0.12 * h}`} stroke={dark} strokeWidth={3} strokeLinecap="round" />

      {/* Hand holding the fish down */}
      <g filter={`url(#${id('sh')})`}>
        <path d={`M${hx + 40},${hy + 40} L${hx + 170},${H + 20} L${hx + 330},${H + 20} L${hx + 150},${hy + 10} Z`} fill="#D49A73" />
        <rect x={hx - 30} y={hy - 58} width={200} height={128} rx={56} fill={skin} transform={rot} />
        {[[-58, -62, 96], [-70, -30, 104], [-70, 4, 100], [-58, 36, 84]].map(([dx, dy, len], i) => (
          <rect key={i} x={hx + dx - len + 40} y={hy + dy} width={len} height={30} rx={15} fill={skin} stroke={skinEdge} strokeOpacity={0.35} transform={rot} />
        ))}
        <path d={`M${hx + 70},${hy + 52} q-30,40 -86,44 q-20,2 -16,-16 q34,-10 54,-46 Z`} fill={skin} stroke={skinEdge} strokeOpacity={0.35} transform={rot} />
      </g>

      {/* Tournament code in black marker on the back of the hand */}
      <text
        x={hx + 78}
        y={hy + 14}
        transform={`rotate(-18 ${hx + 78} ${hy})`}
        fontFamily="'Marker Felt', 'Comic Sans MS', 'Chalkboard SE', cursive"
        fontWeight={700}
        fontSize={40}
        fill="#151515"
        textAnchor="middle"
        opacity={0.92}
      >
        {code}
      </text>
    </svg>
  );
}

'use client';

type Props = {
  data: (number | null | undefined)[];
  color?: string;
  stroke?: number;
  height?: number;
  width?: number;
  fill?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Sparkline({
  data,
  color = 'var(--primary)',
  stroke = 2,
  height = 40,
  width = 200,
  fill = true,
  className,
  ariaLabel,
}: Props) {
  const points = (data || []).map(v => (typeof v === 'number' && isFinite(v) ? v : 0));

  if (points.length < 2) {
    return (
      <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={ariaLabel} role="img" />
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - stroke * 2) - stroke;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={ariaLabel} role="img">
      {fill && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

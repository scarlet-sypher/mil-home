type Segment = { label: string; value: number; color: string };

export function DonutChart({
  total,
  segments,
  size = 96,
  strokeWidth = 12,
}: {
  total: number;
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      {total > 0 &&
        segments
          .filter((segment) => segment.value > 0)
          .map((segment) => {
            const dash = (segment.value / total) * circumference;
            const dashOffset = -offset;
            offset += dash;
            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-bold">
        {total}
      </text>
      <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px] uppercase tracking-wide">
        Total
      </text>
    </svg>
  );
}

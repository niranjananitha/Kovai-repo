const SIZE = 64
const STROKE = 7
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Ring that fills as tasks are completed. The CSS transition makes it tick up smoothly.
export default function ProgressRing({ done, total }) {
  const fraction = total === 0 ? 0 : done / total
  return (
    <div className="flex items-center gap-3">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="shrink-0 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-complete)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <p className="text-sm text-sidebar-ink">
        <span className="block text-lg font-bold tabular-nums text-white">
          {done} of {total}
        </span>
        complete
      </p>
    </div>
  )
}

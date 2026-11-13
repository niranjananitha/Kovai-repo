import { STATUSES } from '../status'

// Status is always a symbol plus a word, never colour alone.
export default function StatusMark({ status, className = '' }) {
  const s = STATUSES.find((x) => x.value === status)
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <span aria-hidden="true" className="text-base leading-none" style={{ color: `var(--color-${s.color})` }}>
        {s.symbol}
      </span>
      {s.label}
    </span>
  )
}

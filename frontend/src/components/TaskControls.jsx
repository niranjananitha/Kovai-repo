import { Trash2 } from 'lucide-react'
import { STATUSES } from '../status'

// A real <select>, so moving a task works with keyboard, touch and screen readers (no dragging needed).
export function StatusSelect({ task, onChange }) {
  return (
    <select
      value={task.status}
      onChange={(e) => onChange(task, e.target.value)}
      aria-label={`Status for ${task.title}`}
      className="min-h-11 rounded-lg border border-line bg-surface px-2 text-sm font-medium"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.symbol} {s.label}
        </option>
      ))}
    </select>
  )
}

export function DeleteButton({ task, onDelete }) {
  return (
    <button
      type="button"
      onClick={() => onDelete(task)}
      aria-label={`Delete ${task.title}`}
      className="grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 size={20} />
    </button>
  )
}

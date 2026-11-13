import { useState } from 'react'
import { STATUSES, statusLabel } from '../status'

const symbolFor = (value) => STATUSES.find((s) => s.value === value)?.symbol ?? ''

export default function TaskItem({ task, busy, onStatusChange, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const created = new Date(task.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <li className="rounded border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-lg font-semibold">{task.title}</h3>
        {/* Status is shown as a symbol AND a word, never colour alone. */}
        <span className="rounded border border-slate-400 px-2 py-0.5 text-sm">
          <span aria-hidden="true">{symbolFor(task.status)} </span>
          {statusLabel(task.status)}
        </span>
      </div>
      {task.description && <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{task.description}</p>}
      <p className="mt-1 text-sm text-slate-600">Created {created}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Status
          <select
            value={task.status}
            disabled={busy}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            aria-label={`Status for ${task.title}`}
            className="rounded border border-slate-400 bg-white px-2 py-1"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {confirming ? (
          <span role="group" aria-label={`Confirm deleting ${task.title}`} className="flex items-center gap-2 text-sm">
            Delete permanently?
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(task.id)}
              className="rounded bg-red-700 px-3 py-1 text-white hover:bg-red-800 disabled:bg-slate-400"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-slate-400 px-3 py-1 hover:bg-slate-100"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${task.title}`}
            className="rounded border border-red-700 px-3 py-1 text-sm text-red-800 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  )
}

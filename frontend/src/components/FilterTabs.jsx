import { FILTERS } from '../status'

export default function FilterTabs({ filter, counts, onChange }) {
  return (
    <nav aria-label="Filter tasks by status" className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          aria-pressed={filter === f.value}
          onClick={() => onChange(f.value)}
          className={`rounded border px-3 py-1 text-sm ${
            filter === f.value
              ? 'border-indigo-700 bg-indigo-700 font-semibold text-white'
              : 'border-slate-400 bg-white hover:bg-slate-100'
          }`}
        >
          {f.label} ({counts[f.value]})
        </button>
      ))}
    </nav>
  )
}

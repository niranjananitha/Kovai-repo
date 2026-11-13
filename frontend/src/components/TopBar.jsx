import { LayoutGrid, List, Menu, Plus, Search } from 'lucide-react'

export default function TopBar({ query, onQuery, searchRef, view, onView, onNew, onOpenMenu }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 md:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-canvas md:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="relative min-w-40 flex-1">
        <label htmlFor="search" className="sr-only">
          Search tasks
        </label>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="search"
          ref={searchRef}
          type="search"
          value={query}
          placeholder="Search tasks  ( / )"
          autoComplete="off"
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onQuery('')
              e.currentTarget.blur()
            }
          }}
          className="field pl-10"
        />
      </div>

      <div role="group" aria-label="View" className="hidden rounded-lg bg-line/60 p-1 sm:flex">
        {[
          ['board', 'Board', LayoutGrid],
          ['list', 'List', List],
        ].map(([value, text, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => onView(value)}
            className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium ${
              view === value ? 'bg-surface font-bold shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="max-md:sr-only">{text}</span>
          </button>
        ))}
      </div>

      <button type="button" onClick={onNew} className="btn btn-primary max-sm:px-0 max-sm:w-11">
        <Plus size={18} aria-hidden="true" />
        <span className="max-sm:sr-only">New task</span> <kbd className="hidden rounded bg-ink/10 px-1.5 text-xs sm:inline">N</kbd>
      </button>
    </div>
  )
}

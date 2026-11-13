// The single source of truth for task statuses on the frontend.
// Values must match backend/app/models.py (STATUSES).
export const STATUSES = [
  { value: 'planned', label: 'Planned', symbol: '○' },
  { value: 'in_progress', label: 'In Progress', symbol: '◐' },
  { value: 'complete', label: 'Complete', symbol: '●' },
]

export const FILTERS = [{ value: 'all', label: 'All' }, ...STATUSES]

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value
}

// Tasks to show for a filter tab ('all' shows everything).
export function filterTasks(tasks, filter) {
  return filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
}

// Number shown on each tab: { all, planned, in_progress, complete }.
export function countByStatus(tasks) {
  const counts = { all: tasks.length }
  for (const s of STATUSES) counts[s.value] = 0
  for (const t of tasks) if (t.status in counts) counts[t.status] += 1
  return counts
}

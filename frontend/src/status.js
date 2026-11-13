// The single source of truth for task statuses on the frontend.
// Values must match backend/app/models.py (STATUSES).
// `color` is a Tailwind token from index.css (text-planned, bg-planned, ...).
export const STATUSES = [
  { value: 'planned', label: 'Planned', symbol: '○', color: 'planned' },
  { value: 'in_progress', label: 'In Progress', symbol: '◐', color: 'progress' },
  { value: 'complete', label: 'Complete', symbol: '●', color: 'complete' },
]

export const FILTERS = [{ value: 'all', label: 'All' }, ...STATUSES]

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value
}

// Tasks to show for a filter ('all' shows everything).
export function filterTasks(tasks, filter) {
  return filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
}

// Number shown next to each status: { all, planned, in_progress, complete }.
export function countByStatus(tasks) {
  const counts = { all: tasks.length }
  for (const s of STATUSES) counts[s.value] = 0
  for (const t of tasks) if (t.status in counts) counts[t.status] += 1
  return counts
}

// Search over title and description, ignoring case and extra spaces.
export function searchTasks(tasks, query) {
  const q = query.trim().toLowerCase()
  if (!q) return tasks
  return tasks.filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(q))
}

// Newest first, like the server's order (ties broken by id).
export function sortNewest(tasks) {
  return [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
}

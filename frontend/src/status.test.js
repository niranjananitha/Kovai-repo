import { describe, expect, it } from 'vitest'
import { FILTERS, STATUSES, countByStatus, filterTasks, statusLabel } from './status'

const tasks = [
  { id: 1, status: 'planned' },
  { id: 2, status: 'complete' },
  { id: 3, status: 'planned' },
]

describe('status helpers', () => {
  it('has the three statuses in one place, plus an All filter', () => {
    expect(STATUSES.map((s) => s.value)).toEqual(['planned', 'in_progress', 'complete'])
    expect(FILTERS[0].value).toBe('all')
  })

  it('maps a value to its label', () => {
    expect(statusLabel('in_progress')).toBe('In Progress')
  })

  it('filters tasks', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3)
    expect(filterTasks(tasks, 'planned').map((t) => t.id)).toEqual([1, 3])
    expect(filterTasks(tasks, 'in_progress')).toEqual([])
  })

  it('counts tasks per tab', () => {
    expect(countByStatus(tasks)).toEqual({ all: 3, planned: 2, in_progress: 0, complete: 1 })
    expect(countByStatus([])).toEqual({ all: 0, planned: 0, in_progress: 0, complete: 0 })
  })
})

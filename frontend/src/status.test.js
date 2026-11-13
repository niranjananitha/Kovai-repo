import { describe, expect, it } from 'vitest'
import { FILTERS, STATUSES, countByStatus, filterTasks, searchTasks, sortNewest, statusLabel } from './status'

const tasks = [
  { id: 1, status: 'planned', title: 'Buy milk', description: '', created_at: '2026-01-01T10:00:00Z' },
  { id: 2, status: 'complete', title: 'File taxes', description: 'Before the DEADLINE', created_at: '2026-01-03T10:00:00Z' },
  { id: 3, status: 'planned', title: 'Call Sam', description: 'about milk', created_at: '2026-01-02T10:00:00Z' },
]

describe('status helpers', () => {
  it('has the three statuses in one place, plus an All filter', () => {
    expect(STATUSES.map((s) => s.value)).toEqual(['planned', 'in_progress', 'complete'])
    expect(FILTERS[0].value).toBe('all')
  })

  it('gives every status a label, a symbol and a colour (never colour alone)', () => {
    for (const s of STATUSES) {
      expect(s.label).toBeTruthy()
      expect(s.symbol).toBeTruthy()
      expect(s.color).toBeTruthy()
    }
  })

  it('maps a value to its label', () => {
    expect(statusLabel('in_progress')).toBe('In Progress')
  })

  it('filters tasks', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3)
    expect(filterTasks(tasks, 'planned').map((t) => t.id)).toEqual([1, 3])
    expect(filterTasks(tasks, 'in_progress')).toEqual([])
  })

  it('counts tasks per status', () => {
    expect(countByStatus(tasks)).toEqual({ all: 3, planned: 2, in_progress: 0, complete: 1 })
    expect(countByStatus([])).toEqual({ all: 0, planned: 0, in_progress: 0, complete: 0 })
  })
})

describe('searchTasks', () => {
  it('returns everything for an empty or blank query', () => {
    expect(searchTasks(tasks, '')).toBe(tasks)
    expect(searchTasks(tasks, '   ')).toBe(tasks)
  })

  it('matches title or description, ignoring case', () => {
    expect(searchTasks(tasks, 'MILK').map((t) => t.id)).toEqual([1, 3])
    expect(searchTasks(tasks, 'deadline').map((t) => t.id)).toEqual([2])
  })

  it('returns nothing when nothing matches', () => {
    expect(searchTasks(tasks, 'zebra')).toEqual([])
  })
})

describe('sortNewest', () => {
  it('orders by created time, newest first, without changing the input', () => {
    expect(sortNewest(tasks).map((t) => t.id)).toEqual([2, 3, 1])
    expect(tasks.map((t) => t.id)).toEqual([1, 2, 3])
  })

  it('breaks ties by id, highest first', () => {
    const tied = [
      { id: 1, created_at: '2026-01-01T00:00:00Z' },
      { id: 2, created_at: '2026-01-01T00:00:00Z' },
    ]
    expect(sortNewest(tied).map((t) => t.id)).toEqual([2, 1])
  })
})

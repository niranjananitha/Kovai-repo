import { useEffect, useState } from 'react'
import { api } from '../api'
import { countByStatus, filterTasks } from '../status'
import FilterTabs from './FilterTabs'
import Loading from './Loading'
import TaskForm from './TaskForm'
import TaskItem from './TaskItem'

export default function TaskBoard({ onSessionExpired }) {
  const [tasks, setTasks] = useState(null) // null = still loading
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Any failed call lands here: an expired session sends the user back to login,
  // everything else is shown in a visible message.
  function fail(err) {
    if (err.status === 401) onSessionExpired()
    else setError(err.message)
  }

  useEffect(() => {
    api('/tasks')
      .then(setTasks)
      .catch((err) => {
        if (err.status === 401) onSessionExpired()
        else {
          setError(err.message)
          setTasks([])
        }
      })
  }, [onSessionExpired])

  async function addTask(title, description) {
    setError('')
    try {
      const task = await api('/tasks', { method: 'POST', body: { title, description } })
      setTasks((current) => [task, ...current])
      return true
    } catch (err) {
      fail(err)
      return false
    }
  }

  async function changeStatus(id, status) {
    setError('')
    setBusyId(id)
    try {
      const updated = await api(`/tasks/${id}`, { method: 'PATCH', body: { status } })
      setTasks((current) => current.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      fail(err)
    }
    setBusyId(null)
  }

  async function deleteTask(id) {
    setError('')
    setBusyId(id)
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((t) => t.id !== id))
    } catch (err) {
      fail(err)
    }
    setBusyId(null)
  }

  const visible = tasks ? filterTasks(tasks, filter) : []

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <TaskForm onAdd={addTask} />

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
          {error}
        </p>
      )}

      {tasks === null ? (
        <Loading text="Loading your tasks…" />
      ) : (
        <>
          <FilterTabs filter={filter} counts={countByStatus(tasks)} onChange={setFilter} />
          {tasks.length === 0 ? (
            <p className="rounded border border-dashed border-slate-400 p-6 text-center text-slate-600">
              No tasks yet. Add your first task above.
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded border border-dashed border-slate-400 p-6 text-center text-slate-600">
              No tasks in this filter.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  busy={busyId === task.id}
                  onStatusChange={changeStatus}
                  onDelete={deleteTask}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

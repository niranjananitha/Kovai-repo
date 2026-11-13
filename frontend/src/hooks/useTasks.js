import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { sortNewest } from '../status'

const UNDO_MS = 5000

// All task data and the actions on it. Every action talks to the real backend.
// Moves and deletes update the screen first (optimistic) and are undone if the server refuses.
export default function useTasks({ onSessionExpired, showToast, dismissToast }) {
  const [tasks, setTasks] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState('')
  const [highlightId, setHighlightId] = useState(null) // newest task, flashes once
  const [completedId, setCompletedId] = useState(null) // task that just became Complete
  // Deletes waiting for the Undo window to pass: task id -> { task, timer, toastId }
  const pendingDeletes = useRef(new Map())

  // A 401 means the session ended: go back to login. Anything else is shown to the user.
  const fail = useCallback(
    (err) => {
      if (err.status === 401) onSessionExpired()
      else showToast({ message: err.message, tone: 'error', duration: 7000 })
    },
    [onSessionExpired, showToast],
  )

  const fetchTasks = useCallback(() => {
    return api('/tasks')
      .then((list) => setTasks(list))
      .catch((err) => {
        if (err.status === 401) onSessionExpired()
        else setLoadError(err.message)
      })
  }, [onSessionExpired])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function retryLoad() {
    setLoadError('')
    setTasks(null)
    fetchTasks()
  }

  // Returns '' on success, or the error message to show inside the dialog.
  async function addTask(title, description) {
    try {
      const task = await api('/tasks', { method: 'POST', body: { title, description } })
      setTasks((current) => [task, ...current])
      setHighlightId(task.id)
      setTimeout(() => setHighlightId((id) => (id === task.id ? null : id)), 1600)
      return ''
    } catch (err) {
      if (err.status === 401) {
        onSessionExpired()
        return ''
      }
      return err.message
    }
  }

  async function changeStatus(task, status) {
    if (task.status === status) return
    const setStatus = (value) =>
      setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, status: value } : t)))

    setStatus(status) // optimistic: the card moves right away
    if (status === 'complete') {
      setCompletedId(task.id)
      setTimeout(() => setCompletedId((id) => (id === task.id ? null : id)), 1500)
    }
    try {
      const saved = await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status } })
      setTasks((current) => current.map((t) => (t.id === task.id ? saved : t)))
    } catch (err) {
      setStatus(task.status) // the server said no: put the card back
      setCompletedId(null)
      fail(err)
    }
  }

  function restore(task) {
    setTasks((current) => sortNewest([...current, task]))
  }

  async function commitDelete(task) {
    pendingDeletes.current.delete(task.id)
    try {
      await api(`/tasks/${task.id}`, { method: 'DELETE' })
    } catch (err) {
      restore(task) // could not delete: bring the task back
      fail(err)
    }
  }

  // No confirm dialog: the task disappears now, "Undo" is available for 5 seconds,
  // and the real DELETE is only sent when that time is up.
  function removeTask(task) {
    if (pendingDeletes.current.has(task.id)) return
    setTasks((current) => current.filter((t) => t.id !== task.id))
    const timer = setTimeout(() => commitDelete(task), UNDO_MS)
    const toastId = showToast({
      message: 'Task deleted.',
      actionLabel: 'Undo',
      duration: UNDO_MS,
      onAction: () => {
        clearTimeout(timer)
        pendingDeletes.current.delete(task.id)
        dismissToast(toastId)
        restore(task)
      },
    })
    pendingDeletes.current.set(task.id, { task, timer, toastId })
  }

  // Before signing out, send any deletes still waiting (the cookie is about to disappear).
  async function flushPendingDeletes() {
    const waiting = [...pendingDeletes.current.values()]
    pendingDeletes.current.clear()
    waiting.forEach((entry) => {
      clearTimeout(entry.timer)
      dismissToast(entry.toastId)
    })
    await Promise.allSettled(waiting.map((entry) => api(`/tasks/${entry.task.id}`, { method: 'DELETE' })))
  }

  return {
    tasks,
    loadError,
    highlightId,
    completedId,
    retryLoad,
    addTask,
    changeStatus,
    removeTask,
    flushPendingDeletes,
  }
}

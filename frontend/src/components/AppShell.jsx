import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import useIsMobile from '../hooks/useIsMobile'
import useTasks from '../hooks/useTasks'
import useToasts from '../hooks/useToasts'
import { STATUSES, countByStatus, searchTasks } from '../status'
import Board from './Board'
import ListView from './ListView'
import Loading from './Loading'
import QuickAddDialog from './QuickAddDialog'
import Sidebar from './Sidebar'
import Toasts from './Toasts'
import TopBar from './TopBar'

// Remember the board/list choice. localStorage can be blocked, so every access is guarded.
function readView() {
  try {
    return localStorage.getItem('taskflow.view') === 'list' ? 'list' : 'board'
  } catch {
    return 'board'
  }
}

export default function AppShell({ user, onSignOut, onSessionExpired }) {
  const [view, setView] = useState(readView)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchRef = useRef(null)
  const isMobile = useIsMobile()

  const { toasts, show, dismiss } = useToasts()
  const data = useTasks({ onSessionExpired, showToast: show, dismissToast: dismiss })

  function changeView(next) {
    setView(next)
    try {
      localStorage.setItem('taskflow.view', next)
    } catch {
      // storage blocked: the choice just is not remembered
    }
  }

  async function signOut() {
    await data.flushPendingDeletes() // finish deletes still waiting, while we still have a session
    onSignOut()
  }

  // Keyboard shortcuts: "/" jumps to search, "N" opens New task. Ignored while typing.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || quickAddOpen) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setQuickAddOpen(true)
      } else if (e.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [quickAddOpen])

  const tasks = data.tasks
  const counts = tasks ? countByStatus(tasks) : { all: 0, planned: 0, in_progress: 0, complete: 0 }
  const visible = tasks ? searchTasks(tasks, query) : []
  const statuses = filter === 'all' ? STATUSES : STATUSES.filter((s) => s.value === filter)
  const taskProps = {
    highlightId: data.highlightId,
    completedId: data.completedId,
    onMove: data.changeStatus,
    onDelete: data.removeTask,
  }

  let content
  if (data.loadError) {
    content = (
      <div role="alert" className="mx-auto max-w-md rounded-xl border border-danger/40 bg-danger/10 p-5 text-center">
        <p className="font-medium text-danger">{data.loadError}</p>
        <button type="button" onClick={data.retryLoad} className="btn btn-primary mt-3">
          Try again
        </button>
      </div>
    )
  } else if (tasks === null) {
    content = <Loading text="Loading your tasks…" />
  } else if (tasks.length === 0) {
    content = (
      <div className="mx-auto max-w-sm rounded-2xl border-2 border-dashed border-line p-8 text-center">
        <h2 className="text-xl font-extrabold">No tasks yet</h2>
        <p className="mt-1 text-muted">
          Press <kbd className="rounded bg-line px-1.5 font-bold">N</kbd> to add one.
        </p>
        <button type="button" onClick={() => setQuickAddOpen(true)} className="btn btn-primary mt-4">
          <Plus size={18} aria-hidden="true" />
          New task
        </button>
      </div>
    )
  } else if (query.trim() && visible.length === 0) {
    content = (
      <p className="py-16 text-center text-muted">
        No tasks match “{query.trim()}”. Press Esc in the search box to clear it.
      </p>
    )
  } else if (view === 'board') {
    content = <Board tasks={visible} statuses={statuses} {...taskProps} />
  } else {
    content = <ListView tasks={visible} statuses={statuses} {...taskProps} />
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {drawerOpen && (
        <div className="fixed inset-0 z-30 bg-ink/50 md:hidden" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}
      {/* A drawer on phones, a normal sidebar from the md breakpoint up. */}
      <aside
        inert={isMobile && !drawerOpen}
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-72 transition-transform md:static md:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-20' : 'md:w-64'} shrink-0`}
      >
        <Sidebar
          user={user}
          view={view}
          onView={changeView}
          filter={filter}
          onFilter={setFilter}
          counts={counts}
          collapsed={collapsed && !isMobile}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onSignOut={signOut}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          view={view}
          onView={changeView}
          onNew={() => setQuickAddOpen(true)}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">{content}</main>
      </div>

      <QuickAddDialog open={quickAddOpen} onAdd={data.addTask} onClose={() => setQuickAddOpen(false)} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

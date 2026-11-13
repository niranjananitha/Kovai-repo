import { LayoutGrid, List, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { FILTERS, STATUSES } from '../status'
import Avatar from './Avatar'
import Logo from './Logo'
import ProgressRing from './ProgressRing'

function NavButton({ active, onClick, collapsed, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      title={title}
      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium ${
        collapsed ? 'md:justify-center md:px-0' : ''
      } ${active ? 'bg-white/15 text-white' : 'text-sidebar-ink hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}

// Hides the text on a collapsed desktop sidebar but keeps it for screen readers.
const label = (collapsed) => (collapsed ? 'md:sr-only' : '')

export default function Sidebar({
  user,
  view,
  onView,
  filter,
  onFilter,
  counts,
  collapsed,
  onToggleCollapse,
  onSignOut,
  onNavigate,
}) {
  const symbolFor = (value) => STATUSES.find((s) => s.value === value)?.symbol

  return (
    <div className="on-dark flex h-full flex-col gap-6 bg-sidebar p-3 text-sidebar-ink">
      <div className="flex items-center justify-between px-1 pt-1">
        <Logo light showName={!collapsed} />
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden min-h-11 min-w-11 place-items-center rounded-lg hover:bg-white/10 md:grid"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav aria-label="Views" className="space-y-1">
        <NavButton active={view === 'board'} collapsed={collapsed} title="Board" onClick={() => { onView('board'); onNavigate() }}>
          <LayoutGrid size={20} />
          <span className={label(collapsed)}>Board</span>
        </NavButton>
        <NavButton active={view === 'list'} collapsed={collapsed} title="List" onClick={() => { onView('list'); onNavigate() }}>
          <List size={20} />
          <span className={label(collapsed)}>List</span>
        </NavButton>
      </nav>

      <nav aria-label="Filter by status" className="space-y-1">
        <p className={`px-3 pb-1 text-sm font-bold text-white ${label(collapsed)}`}>Status</p>
        {FILTERS.map((f) => (
          <NavButton
            key={f.value}
            active={filter === f.value}
            collapsed={collapsed}
            title={f.label}
            onClick={() => { onFilter(f.value); onNavigate() }}
          >
            <span aria-hidden="true" className="w-5 text-center text-base">
              {symbolFor(f.value) ?? '◎'}
            </span>
            <span className={`flex-1 ${label(collapsed)}`}>{f.label}</span>
            <span className={`text-sm tabular-nums ${collapsed ? 'md:sr-only' : ''}`}>{counts[f.value]}</span>
          </NavButton>
        ))}
      </nav>

      <div className={`mt-auto ${collapsed ? 'md:hidden' : ''}`}>
        <ProgressRing done={counts.complete} total={counts.all} />
      </div>

      <div className={`flex items-center gap-3 border-t border-white/15 pt-3 ${collapsed ? 'md:flex-col' : ''}`}>
        <Avatar user={user} />
        <div className={`min-w-0 flex-1 ${label(collapsed)}`}>
          <p className="truncate text-sm font-bold text-white">{user.name || user.email}</p>
          {user.name && <p className="truncate text-xs">{user.email}</p>}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-white/10"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}

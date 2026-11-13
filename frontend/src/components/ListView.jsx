import { shortDate } from '../format'
import { filterTasks } from '../status'
import StatusMark from './StatusMark'
import { DeleteButton, StatusSelect } from './TaskControls'
import TaskTitle from './TaskTitle'

function Row({ task, highlightId, completedId, onMove, onDelete }) {
  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2 last:border-b-0 ${
        highlightId === task.id ? 'flash' : ''
      }`}
    >
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-bold [overflow-wrap:anywhere]">
          <TaskTitle title={task.title} complete={task.status === 'complete'} celebrate={completedId === task.id} />
        </p>
        {task.description && <p className="truncate text-sm text-muted">{task.description}</p>}
      </div>
      <span className="text-xs text-muted tabular-nums">{shortDate(task.created_at)}</span>
      <StatusSelect task={task} onChange={onMove} />
      <DeleteButton task={task} onDelete={onDelete} />
    </li>
  )
}

// Compact rows, grouped by status. Same actions as the board.
export default function ListView({ tasks, statuses, ...rowProps }) {
  return (
    <div className="space-y-5">
      {statuses.map((status) => {
        const group = filterTasks(tasks, status.value)
        return (
          <section key={status.value} aria-label={`${status.label}, ${group.length} tasks`}>
            <h2 className="mb-2 flex items-center gap-2 px-1">
              <StatusMark status={status.value} className="text-base! font-bold" />
              <span className="rounded-full bg-surface px-2 text-sm font-medium tabular-nums">{group.length}</span>
            </h2>
            {group.length === 0 ? (
              <p className="px-1 text-sm text-muted">Nothing here yet.</p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-line bg-surface">
                {group.map((task) => (
                  <Row key={task.id} task={task} {...rowProps} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

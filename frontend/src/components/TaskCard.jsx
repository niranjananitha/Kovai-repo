import { shortDate } from '../format'
import { DeleteButton, StatusSelect } from './TaskControls'
import TaskTitle from './TaskTitle'

// One task as a card. Used on the board and, with preview, as the picture that follows the pointer.
// `handle` is the drag grip (supplied by the board); `preview` turns the controls off.
export default function TaskCard({ task, handle, preview = false, flash, celebrate, onMove, onDelete }) {
  return (
    <article
      aria-label={task.title}
      className={`rounded-xl border border-line bg-surface p-3 ${flash ? 'flash' : ''} ${preview ? 'rotate-2 shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-1">
        {handle}
        <h3 className="min-w-0 flex-1 pt-2 text-base font-bold leading-snug [overflow-wrap:anywhere]">
          <TaskTitle title={task.title} complete={task.status === 'complete'} celebrate={celebrate} />
        </h3>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap pl-1 text-sm text-muted [overflow-wrap:anywhere]">
          {task.description}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="pl-1 text-xs text-muted tabular-nums">{shortDate(task.created_at)}</span>
        {!preview && (
          <div className="flex items-center gap-1">
            <StatusSelect task={task} onChange={onMove} />
            <DeleteButton task={task} onDelete={onDelete} />
          </div>
        )}
      </div>
    </article>
  )
}

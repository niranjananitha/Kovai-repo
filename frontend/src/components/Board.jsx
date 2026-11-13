import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { filterTasks, statusLabel } from '../status'
import StatusMark from './StatusMark'
import TaskCard from './TaskCard'

// Pointer position first (accurate for mouse and touch); falls back to overlap for the keyboard.
function collisionDetection(args) {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

function DraggableCard({ task, highlightId, completedId, onMove, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: task.id })

  // The grip is the drag handle: it is a real button, so Space/Enter picks the card up
  // and the arrow keys move it. Everything else on the card stays clickable and scrollable.
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Drag ${task.title}`}
      className="grid min-h-11 min-w-11 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted hover:bg-canvas active:cursor-grabbing"
    >
      <GripVertical size={18} />
    </button>
  )

  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-40' : ''}>
      <TaskCard
        task={task}
        handle={handle}
        flash={highlightId === task.id}
        celebrate={completedId === task.id}
        onMove={onMove}
        onDelete={onDelete}
      />
    </div>
  )
}

function Column({ status, tasks, ...cardProps }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value })
  return (
    <section
      ref={setNodeRef}
      aria-label={`${status.label}, ${tasks.length} tasks`}
      className={`min-w-[85%] snap-center rounded-2xl p-3 transition-colors md:min-w-0 ${isOver ? 'bg-accent/25' : 'bg-line/50'}`}
    >
      <h2 className="mb-3 flex items-center justify-between px-1">
        <StatusMark status={status.value} className="text-base! font-bold" />
        <span className="rounded-full bg-surface px-2 text-sm font-medium tabular-nums">{tasks.length}</span>
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} {...cardProps} />
        ))}
        {tasks.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted">Nothing here yet.</p>}
      </div>
    </section>
  )
}

// Three columns (swipeable on a phone). Drag a card to another column, or use its status menu.
export default function Board({ tasks, statuses, highlightId, completedId, onMove, onDelete }) {
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const titleOf = (id) => tasks.find((t) => t.id === id)?.title ?? 'task'

  // Spoken by screen readers while dragging.
  const announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over ${statusLabel(over.id)}.` : `${titleOf(active.id)} is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} was dropped in ${statusLabel(over.id)}.` : `${titleOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Dragging cancelled. ${titleOf(active.id)} was not moved.`,
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    const task = tasks.find((t) => t.id === active.id)
    if (task && over) onMove(task, over.id)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={({ active }) => setActiveTask(tasks.find((t) => t.id === active.id) ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] md:grid md:overflow-visible ${
          statuses.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-3'
        }`}
      >
        {statuses.map((status) => (
          <Column
            key={status.value}
            status={status}
            tasks={filterTasks(tasks, status.value)}
            highlightId={highlightId}
            completedId={completedId}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} preview /> : null}</DragOverlay>
    </DndContext>
  )
}

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  showTitleCounter,
  validateDescription,
  validateTitle,
} from '../validation'

// The form lives inside the dialog and is only rendered while open, so it starts empty each time.
function QuickAddForm({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const titleError = title.trim() ? validateTitle(title) : ''
  const descriptionError = validateDescription(description)
  const canSubmit = !submitting && !validateTitle(title) && !descriptionError

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setServerError('')
    const error = await onAdd(title.trim(), description.trim())
    if (error) {
      setServerError(error)
      setSubmitting(false)
    } else {
      onClose()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault() // Enter in the title box saves
        submit()
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="new-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="new-title"
          className="field"
          autoComplete="off"
          value={title}
          aria-invalid={Boolean(titleError)}
          aria-describedby="new-title-help"
          onChange={(e) => setTitle(e.target.value)}
        />
        <p id="new-title-help" className="mt-1 min-h-5 text-sm">
          {titleError && <span className="text-danger">{titleError} </span>}
          {showTitleCounter(title) && (
            <span className="text-muted tabular-nums">
              {title.trim().length}/{TITLE_MAX}
            </span>
          )}
        </p>
      </div>

      <div>
        <label htmlFor="new-description" className="mb-1 block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="new-description"
          rows={3}
          className="field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            // Enter saves; Shift+Enter adds a new line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        {descriptionError && (
          <p className="mt-1 text-sm text-danger tabular-nums">
            {descriptionError} ({description.trim().length}/{DESCRIPTION_MAX})
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Enter to save · Shift+Enter for a new line · Esc to close</p>
        <button type="submit" disabled={!canSubmit} className="btn btn-primary">
          {submitting ? 'Adding…' : 'Add task'}
        </button>
      </div>
    </form>
  )
}

// A native <dialog>: the browser traps focus inside it and closes it with Esc.
export default function QuickAddDialog({ open, onAdd, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('#new-title')?.focus() // showModal focuses the Close button; we want the title
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="quick-add-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-surface p-5 text-ink shadow-2xl backdrop:bg-ink/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 id="quick-add-title" className="text-xl font-extrabold">
          New task
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-canvas"
        >
          <X size={20} />
        </button>
      </div>
      {open && <QuickAddForm onAdd={onAdd} onClose={onClose} />}
    </dialog>
  )
}

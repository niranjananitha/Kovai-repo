import { useState } from 'react'
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  showTitleCounter,
  validateDescription,
  validateTitle,
} from '../validation'

// onAdd(title, description) must return true when the task was saved.
export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const titleError = title.trim() ? validateTitle(title) : ''
  const descriptionError = validateDescription(description)
  const canSubmit = !submitting && !validateTitle(title) && !descriptionError

  async function handleSubmit(e) {
    e.preventDefault() // pressing Enter in the title box submits the form
    if (!canSubmit) return
    setSubmitting(true)
    const saved = await onAdd(title.trim(), description.trim())
    setSubmitting(false)
    if (saved) {
      setTitle('')
      setDescription('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor="task-title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-describedby="title-help"
          aria-invalid={titleError ? 'true' : 'false'}
          className="mt-1 w-full rounded border border-slate-400 px-3 py-2"
        />
        <p id="title-help" className="mt-1 min-h-5 text-sm">
          {titleError && <span className="text-red-700">{titleError} </span>}
          {showTitleCounter(title) && (
            <span className="text-slate-600">
              {title.trim().length}/{TITLE_MAX}
            </span>
          )}
        </p>
      </div>

      <div className="mt-2">
        <label htmlFor="task-description" className="block text-sm font-medium">
          Description <span className="font-normal text-slate-600">(optional)</span>
        </label>
        <textarea
          id="task-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border border-slate-400 px-3 py-2"
        />
        {descriptionError && (
          <p className="mt-1 text-sm text-red-700">
            {descriptionError} ({description.trim().length}/{DESCRIPTION_MAX})
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 rounded bg-indigo-700 px-4 py-2 font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}

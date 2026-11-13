import { useEffect, useState } from 'react'

const SLOW_AFTER_MS = 5000

// Spinner + text. The free host sleeps when idle, so after 5 seconds we explain the wait.
export default function Loading({ text = 'Loading…' }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-center text-slate-600">
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"
      />
      <p>{slow ? 'Waking up the server, this can take up to a minute' : text}</p>
    </div>
  )
}

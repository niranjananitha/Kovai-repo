import { useEffect, useState } from 'react'

const SLOW_AFTER_MS = 5000

// Spinner + text. The free host sleeps when idle, so after 5 seconds we explain the wait.
export default function Loading({ text = 'Loading…', fullScreen = false }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 p-8 text-center text-muted ${fullScreen ? 'min-h-dvh' : 'py-16'}`}
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-ink"
      />
      <p>{slow ? 'Waking up the server, this can take up to a minute' : text}</p>
    </div>
  )
}

import { useCallback, useRef, useState } from 'react'

// Small messages at the bottom of the screen. An optional action button (like "Undo") is supported.
export default function useToasts() {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    ({ message, tone = 'info', actionLabel, onAction, duration = 5000 }) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-2), { id, message, tone, actionLabel, onAction }])
      setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return { toasts, show, dismiss }
}

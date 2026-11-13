// Messages float above the page (fixed position), so they never push the layout around.
// The region is "polite": screen readers announce new messages without interrupting.
export default function Toasts({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-lg px-4 py-2 text-sm shadow-lg ${
            t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'
          }`}
        >
          <span>{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              onClick={() => {
                t.onAction()
                onDismiss(t.id)
              }}
              className="min-h-11 rounded px-2 font-bold text-accent underline underline-offset-2"
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

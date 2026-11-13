// A task title. When the task is Complete, every word gets a hand-drawn line through it.
// `celebrate` is true only right after the task was completed, so the lines scribble in once;
// tasks that were already complete just show the lines.
export default function TaskTitle({ title, complete, celebrate }) {
  if (!complete) return <span>{title}</span>

  return (
    <span className="text-muted">
      {title.split(' ').map((word, i) => (
        <span key={i}>
          {i > 0 && ' '}
          <span className="relative inline-block">
            {word}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              style={{ '--i': i }}
              className={`strike pointer-events-none absolute -inset-x-0.5 top-1/2 h-[0.45em] -translate-y-1/2 text-ink ${celebrate ? 'strike-animate' : ''}`}
            >
              <path
                d="M1 6 C 20 2, 35 9, 55 5 S 85 3, 99 5"
                pathLength="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </span>
      ))}
    </span>
  )
}

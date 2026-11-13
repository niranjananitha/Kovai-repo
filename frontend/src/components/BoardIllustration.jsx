// Decorative mini board for the sign-in screen. The only automatic animation in the app:
// one card slides from In Progress to Complete once, then stays put.
const COLUMNS = ['Planned', 'In progress', 'Complete']

function Skeleton({ wide = false }) {
  return (
    <div className="space-y-2 rounded-lg bg-white/10 p-3">
      <div className={`h-2 rounded bg-white/40 ${wide ? 'w-4/5' : 'w-3/5'}`} />
      <div className="h-2 w-2/5 rounded bg-white/20" />
    </div>
  )
}

export default function BoardIllustration() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-lg">
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((name) => (
          <div key={name} className="space-y-3">
            <p className="text-sm font-bold text-sidebar-ink">{name}</p>
            {name === 'Planned' && (
              <>
                <Skeleton wide />
                <Skeleton />
              </>
            )}
            {name === 'In progress' && <Skeleton wide />}
            {name === 'Complete' && <Skeleton />}
          </div>
        ))}
      </div>

      {/* The moving card starts in the middle column and slides one column to the right. */}
      <div
        className="slide-across absolute top-[2.75rem] w-[calc((100%-1.5rem)/3)] space-y-2 rounded-lg bg-accent p-3 shadow-lg"
        style={{ left: 'calc((100% - 1.5rem) / 3 + 0.75rem)', marginTop: '3.9rem' }}
      >
        <div className="relative h-2 w-4/5 rounded bg-ink/70">
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -inset-x-1 top-1/2 h-3 -translate-y-1/2">
            <path d="M1 6 C 20 2, 35 9, 55 5 S 85 3, 99 5" fill="none" stroke="#1A2233" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="h-2 w-2/5 rounded bg-ink/30" />
      </div>
    </div>
  )
}

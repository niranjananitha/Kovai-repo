import { Check } from 'lucide-react'

export default function Logo({ light = false, showName = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-ink">
        <Check size={20} strokeWidth={3} />
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'} ${showName ? '' : 'sr-only'}`}>
        TaskFlow
      </span>
    </span>
  )
}

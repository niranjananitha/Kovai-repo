import { useState } from 'react'
import { initials } from '../format'

// Google picture if we have one (and it loads), otherwise the person's initials.
export default function Avatar({ user, size = 36 }) {
  const [failed, setFailed] = useState(false)
  const box = { width: size, height: size }

  if (user.picture_url && !failed) {
    return (
      <img
        src={user.picture_url}
        alt=""
        style={box}
        className="shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={box}
      className="grid shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-ink"
    >
      {initials(user.name, user.email)}
    </span>
  )
}

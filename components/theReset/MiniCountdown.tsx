'use client'

import { useEffect, useState } from 'react'

function getRemaining(targetIso: string) {
  const diff = Math.max(new Date(targetIso).getTime() - Date.now(), 0)
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  }
}

// Compact inline ticker for spots where the full LaunchCountdown block
// would be too heavy (e.g. inside the dashboard hero card).
export default function MiniCountdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1000)
    return () => clearInterval(id)
  }, [targetIso])

  const { hours, minutes, seconds } = remaining
  const label = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : `${minutes}m ${String(seconds).padStart(2, '0')}s`

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[#c9a84c] tabular-nums">
      <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
      {label}
    </span>
  )
}

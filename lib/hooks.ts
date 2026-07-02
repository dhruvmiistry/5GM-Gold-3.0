import { useEffect, useState } from 'react'

// Ticks every second until targetMs is reached, then stops. Used to drive
// live countdown displays (e.g. scheduled video release locks).
export function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()))
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - Date.now())), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs, remaining <= 0])
  return remaining
}

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now()
  const clamped = Math.max(diff, 0)
  return {
    done: diff <= 0,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1_000) % 60),
  }
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)' }}
      >
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative text-base sm:text-3xl font-mono font-semibold text-gold-gradient tabular-nums"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </div>
      <span className="mt-1.5 sm:mt-2 text-[8px] sm:text-[10px] uppercase tracking-widest text-[#5a5a66] font-semibold">{label}</span>
    </div>
  )
}

// Matches a Unit's box height so the ':' separator sits centred against the
// number, not the label underneath it — avoids a magic padding-bottom value
// that only lines up at one specific box size.
function Separator() {
  return (
    <div className="flex h-12 sm:h-20 items-center shrink-0">
      <span className="text-[#3a3a42] text-base sm:text-2xl font-light">:</span>
    </div>
  )
}

// Client-side ticker only — the actual unlock is decided server-side by
// getResetModule() comparing release_date to the current request time
// (same mechanism the Free Videos list already uses). This component just
// visualises the wait and re-fetches once it reaches zero; it grants
// nothing on its own.
export default function LaunchCountdown({ targetIso, onElapsed }: { targetIso: string; onElapsed: () => void }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso))

  useEffect(() => {
    const id = setInterval(() => {
      const next = getRemaining(targetIso)
      setRemaining(next)
      if (next.done) {
        clearInterval(id)
        onElapsed()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [targetIso, onElapsed])

  const launchLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Europe/London',
  }).format(new Date(targetIso))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-8 text-center"
      style={{ background: 'rgba(17,17,19,0.75)', border: '1px solid rgba(201,168,76,0.2)' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 65%)' }} />
      <div className="relative">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl mx-auto mb-3 sm:mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
          <RotateCcw size={15} className="text-black sm:hidden" strokeWidth={2} />
          <RotateCcw size={18} className="text-black hidden sm:block" strokeWidth={2} />
        </div>
        <p className="section-label mb-1.5">The Reset</p>
        <h2 className="text-white text-base sm:text-2xl font-light tracking-tight mb-1 px-2">
          Your 20 lessons unlock in
        </h2>
        <p className="text-[#5a5a66] text-[11px] sm:text-xs mb-4 sm:mb-6">{launchLabel} &middot; UK time</p>

        <div className="flex items-center justify-center gap-1.5 sm:gap-4">
          <Unit value={remaining.days} label="Days" />
          <Separator />
          <Unit value={remaining.hours} label="Hours" />
          <Separator />
          <Unit value={remaining.minutes} label="Mins" />
          <Separator />
          <Unit value={remaining.seconds} label="Secs" />
        </div>
      </div>
    </motion.div>
  )
}

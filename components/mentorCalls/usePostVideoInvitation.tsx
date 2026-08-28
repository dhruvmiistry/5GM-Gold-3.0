'use client'

import { useState, useCallback, useRef } from 'react'
import PostVideoInvitationDialog from './PostVideoInvitationDialog'

// Shared by Free Videos and The Reset — call onVideoEnded() from the
// player's real onEnded event (never on open/click) for whichever video is
// currently playing. Handles the server-side eligibility check, the
// "mark shown" call that starts the 24h cooldown, and renders the dialog.
export function usePostVideoInvitation() {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<'free' | 'gold'>('free')
  const [balance, setBalance] = useState(0)
  const firedForRef = useRef<string | null>(null)

  // Guards against a single video's `ended` event firing more than once
  // (mux-player can double-dispatch on some browsers/replay edge cases) —
  // keyed per video id so a genuinely different video can still trigger it.
  const onVideoEnded = useCallback((videoId: string) => {
    if (firedForRef.current === videoId) return
    firedForRef.current = videoId

    fetch('/api/mentor-calls/invitation-eligibility')
      .then(r => r.json())
      .then(data => {
        if (!data.eligible) return
        setPlan(data.plan)
        setBalance(data.balance)
        setOpen(true)
        fetch('/api/mentor-calls/invitation-eligibility', { method: 'POST' }).catch(() => {})
      })
      .catch(() => {})
  }, [])

  // Call when a new video starts playing, so a later replay of the same
  // video (or a different one) gets a fresh chance to fire on end.
  const resetGuard = useCallback(() => { firedForRef.current = null }, [])

  const dialog = (
    <PostVideoInvitationDialog
      open={open}
      onOpenChange={setOpen}
      plan={plan}
      balance={balance}
      onPrimaryClick={() => setOpen(false)}
    />
  )

  return { dialog, onVideoEnded, resetGuard }
}

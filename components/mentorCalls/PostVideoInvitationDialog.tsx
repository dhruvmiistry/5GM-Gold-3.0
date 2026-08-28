'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { RotateCcw, X } from 'lucide-react'

interface PostVideoInvitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: 'free' | 'gold'
  balance: number
  onPrimaryClick: () => void
}

// Radix Dialog handles focus trap, ESC-to-close, and ARIA wiring —
// deliberately used here (already a project dependency, previously
// unused) rather than the hand-rolled backdrop-div pattern the rest of
// this codebase uses for modals, since accessibility is an explicit
// requirement for this specific dialog.
export default function PostVideoInvitationDialog({ open, onOpenChange, plan, balance, onPrimaryClick }: PostVideoInvitationDialogProps) {
  const isGold = plan === 'gold'
  const title = isGold ? 'Ready for your next mentor check-in?' : "Let's talk about your trading journey."
  const body = isGold
    ? 'Review your progress, work through your questions, and plan your next steps with a 5GM mentor.'
    : "Book a one-to-one with a 5GM mentor to discuss where you are, what's holding you back, and which next steps could suit you."
  const primaryLabel = isGold ? 'Book my next call' : 'Book my mentor call'
  const balanceLabel = `You have ${balance} complimentary call${balance === 1 ? '' : 's'} available.`

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[60] motion-safe:transition-opacity motion-safe:duration-200"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        />
        <Dialog.Content
          className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 motion-safe:transition-all motion-safe:duration-200 focus:outline-none"
          style={{ background: 'rgba(15,15,17,0.98)', border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        >
          <Dialog.Close asChild>
            <button aria-label="Dismiss"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
              <X size={15} />
            </button>
          </Dialog.Close>

          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
            <RotateCcw size={19} className="text-black" strokeWidth={2} />
          </div>

          <Dialog.Title className="text-white text-lg font-medium tracking-tight mb-2">{title}</Dialog.Title>
          <Dialog.Description className="text-[#8e8e9a] text-sm leading-relaxed mb-4">{body}</Dialog.Description>

          <p className="text-[#c9a84c] text-xs font-medium mb-5">{balanceLabel}</p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link href="/dashboard/mentor-calls" onClick={onPrimaryClick}
              className="flex-1 flex items-center justify-center px-5 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all">
              {primaryLabel}
            </Link>
            <Dialog.Close asChild>
              <button className="px-5 py-3 rounded-xl text-sm font-medium text-[#8e8e9a] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Maybe later
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

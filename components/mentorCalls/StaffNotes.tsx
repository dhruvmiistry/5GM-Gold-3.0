'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Lock, Send } from 'lucide-react'

type Note = { id: string; author_id: string; body: string; created_at: string; author: { full_name: string | null; role: string } | null }

// Admin/mentor only — never rendered on any member-facing page. Kept
// visually distinct (red-tinted, explicit "private" label) so it can
// never be mistaken for the member-visible thread.
export default function StaffNotes({ apiBase }: { apiBase: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(apiBase).then(r => r.json()).then(data => { setNotes(Array.isArray(data) ? data : []); setLoading(false) }).catch(() => setLoading(false))
  }, [apiBase])

  useEffect(() => { load() }, [load])

  const send = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    setError(null)
    const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: draft }) })
    setSending(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Failed to save'); return }
    setDraft('')
    load()
  }

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px dashed rgba(239,68,68,0.2)' }}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(248,113,113,0.8)' }}>
        <Lock size={10} /> Private staff notes — not visible to the member
      </p>

      {loading ? (
        <div className="py-2"><Loader2 size={13} className="animate-spin text-[#5a5a66]" /></div>
      ) : notes.length === 0 ? (
        <p className="text-[#5a5a66] text-[11px]">No staff notes yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {notes.map(n => (
            <div key={n.id} className="p-2 rounded-lg text-[11px]" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-semibold text-[#8e8e9a]">{n.author?.full_name ?? n.author?.role}</span>
                <span className="text-[9px] text-[#5a5a66] ml-auto">{new Date(n.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <p className="text-[#f5f5f7] whitespace-pre-wrap break-words">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-[10px]">{error}</p>}

      <div className="flex items-center gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Add a private note…" maxLength={4000} aria-label="Private staff note"
          className="input-dark flex-1 text-[11px]" />
        <button onClick={send} disabled={sending || !draft.trim()} aria-label="Save note"
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
      </div>
    </div>
  )
}

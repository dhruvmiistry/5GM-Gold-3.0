'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, MessageSquare } from 'lucide-react'

type Message = {
  id: string; sender_id: string; body: string; created_at: string
  sender: { full_name: string | null; role: string } | null
}

// Reused by member/mentor/admin views — only apiBase and currentUserId
// differ per caller. Renders plain text only (React escapes {m.body} by
// default; never dangerouslySetInnerHTML) — safe against injected markup.
export default function MessageThread({ apiBase, currentUserId }: { apiBase: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [previousReadAt, setPreviousReadAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(apiBase)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data.messages) ? data.messages : [])
        setPreviousReadAt(data.previousReadAt ?? null)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load messages'); setLoading(false) })
  }, [apiBase])

  useEffect(() => { load() }, [load])

  const send = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    setError(null)
    const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: draft }) })
    setSending(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Failed to send'); return }
    setDraft('')
    load()
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={15} className="animate-spin text-[#c9a84c]" /></div>
      ) : messages.length === 0 ? (
        <p className="text-[#5a5a66] text-xs py-1 flex items-center gap-1.5"><MessageSquare size={12} /> No messages yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {messages.map(m => {
            const isMe = m.sender_id === currentUserId
            const isUnread = !isMe && (!previousReadAt || new Date(m.created_at) > new Date(previousReadAt))
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs"
                  style={isMe
                    ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', color: '#f5f5f7' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f7' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: isMe ? '#c9a84c' : '#8e8e9a' }}>
                      {isMe ? 'You' : (m.sender?.full_name ?? m.sender?.role ?? 'Them')}
                    </span>
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" aria-label="Unread" />}
                    <span className="text-[9px] text-[#5a5a66] ml-auto">
                      {new Date(m.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-red-400 text-[11px]">{error}</p>}

      <div className="flex items-center gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message…" maxLength={4000} aria-label="Message"
          className="input-dark flex-1 text-xs" />
        <button onClick={send} disabled={sending || !draft.trim()} aria-label="Send message"
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  )
}

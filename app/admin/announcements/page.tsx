'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Edit2, Trash2, Loader2, X, Bell, Pin, Image as ImageIcon, Send, Eye, Search, UserCircle2 } from 'lucide-react'
import { announcementHtml, escapeHtml } from '@/lib/emailTemplates'

type Announcement = {
  id: string; title: string; body: string; audience: string
  pinned: boolean; status: string; scheduled_for: string | null
  published_at: string | null; created_at: string; banner_url: string | null
}

type UserResult = { id: string; full_name: string | null; email: string }

const emptyForm = {
  title: '', body: '', audience: 'all', pinned: false,
  status: 'draft', scheduled_for: '', banner_url: '',
}

const RECIPIENT_LABELS: Record<string, string> = {
  all: 'All Members', free: 'Free Only', gold: 'Gold Only', admin: 'Admins Only', specific: 'Specific Person',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    scheduled: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
  }
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.draft}`}>
      {status}
    </span>
  )
}

function AudienceBadge({ audience }: { audience: string }) {
  const map: Record<string, string> = {
    all: 'text-[#8e8e9a] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    gold: 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border-[rgba(201,168,76,0.15)]',
    free: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)]',
  }
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[audience] ?? map.all}`}>
      {audience}
    </span>
  )
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Banner image upload
  const [bannerUploading, setBannerUploading] = useState(false)
  const bannerFileRef = useRef<HTMLInputElement>(null)

  // Email composer
  const [emailRecipient, setEmailRecipient] = useState('all')
  const [targetUser, setTargetUser] = useState<UserResult | null>(null)
  const [targetQuery, setTargetQuery] = useState('')
  const [targetResults, setTargetResults] = useState<UserResult[]>([])
  const [targetSearching, setTargetSearching] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/announcements?${params}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Debounced search for "specific person" recipient
  useEffect(() => {
    if (emailRecipient !== 'specific' || !targetQuery.trim()) { setTargetResults([]); return }
    setTargetSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(targetQuery)}`)
      const data = await res.json().catch(() => null)
      setTargetResults(Array.isArray(data?.data) ? data.data : [])
      setTargetSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [targetQuery, emailRecipient])

  const resetEmailComposer = () => {
    setEmailRecipient('all')
    setTargetUser(null)
    setTargetQuery('')
    setTargetResults([])
    setShowPreview(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    resetEmailComposer()
    setPanelOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title: a.title, body: a.body, audience: a.audience,
      pinned: a.pinned, status: a.status,
      scheduled_for: a.scheduled_for ? a.scheduled_for.slice(0, 16) : '',
      banner_url: a.banner_url ?? '',
    })
    resetEmailComposer()
    setPanelOpen(true)
  }

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return }
    setBannerUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload-thumbnail', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    setBannerUploading(false)
    if (!res.ok || !data.url) { showToast(data.error || 'Banner upload failed'); return }
    setForm(p => ({ ...p, banner_url: data.url }))
  }

  const handleSave = async () => {
    setSaving(true)
    const body = { ...form, scheduled_for: form.scheduled_for || null, banner_url: form.banner_url || null }
    if (editing) {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Update failed'); setSaving(false); return }
      showToast('Announcement updated')
    } else {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Create failed'); setSaving(false); return }
      showToast('Announcement created')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    setDeleting(id)
    const res = await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Delete failed'); return }
    showToast('Announcement deleted')
    fetchItems()
  }

  const handleSendEmail = async () => {
    if (!form.title || !form.body) { showToast('Add a title and body first'); return }
    if (emailRecipient === 'specific' && !targetUser) { showToast('Pick a recipient first'); return }

    const label = emailRecipient === 'specific' ? targetUser!.email : RECIPIENT_LABELS[emailRecipient]
    if (!confirm(`Send this email to ${label}?`)) return

    setSendingEmail(true)
    const res = await fetch('/api/admin/announcements/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: form.title,
        body: form.body,
        bannerUrl: form.banner_url || null,
        recipient: emailRecipient,
        targetUserId: targetUser?.id ?? null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSendingEmail(false)
    if (!res.ok) { showToast(data.error || 'Send failed'); return }
    showToast(`Email sent to ${data.sent} recipient${data.sent === 1 ? '' : 's'}`)
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Announcements</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{items.length} announcements</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> New Announcement
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {['all', 'draft', 'scheduled', 'published'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all capitalize"
              style={statusFilter === f
                ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <Bell size={24} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No announcements</p>
            <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Create one →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id}
                className="flex items-start gap-4 px-5 py-4 rounded-2xl transition-all"
                style={{ background: 'rgba(17,17,19,0.85)', border: `1px solid ${item.pinned ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.pinned && <Pin size={11} className="text-[#c9a84c] shrink-0" />}
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  </div>
                  <p className="text-[#5a5a66] text-xs line-clamp-2 mb-2">{item.body}</p>
                  <div className="flex items-center gap-2">
                    <AudienceBadge audience={item.audience} />
                    <StatusBadge status={item.status} />
                    <span className="text-[#3a3a46] text-[10px]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    {item.scheduled_for && (
                      <span className="text-[#5a5a66] text-[10px]">
                        · scheduled {new Date(item.scheduled_for).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {deleting === item.id ? (
                    <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                  ) : (
                    <>
                      <button onClick={() => openEdit(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-all">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <h2 className="text-white font-medium">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title" className="input-dark w-full text-sm" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Body</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Announcement content…" rows={6}
                  className="input-dark w-full text-sm resize-none" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Banner Image (optional)</label>
                <input ref={bannerFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerFile(f) }} />
                {form.banner_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.banner_url} alt="" className="w-full aspect-[21/9] object-cover" />
                    <button onClick={() => setForm(p => ({ ...p, banner_url: '' }))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => bannerFileRef.current?.click()} disabled={bannerUploading}
                    className="w-full flex items-center justify-center gap-2 py-6 rounded-xl text-sm text-[#5a5a66] hover:text-[#8e8e9a] transition-all"
                    style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                    {bannerUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    {bannerUploading ? 'Uploading…' : 'Upload banner image'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Audience</label>
                  <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="all">All Members</option>
                    <option value="free">Free Only</option>
                    <option value="gold">Gold Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {form.status === 'scheduled' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Scheduled For</label>
                  <input type="datetime-local" value={form.scheduled_for}
                    onChange={e => setForm(p => ({ ...p, scheduled_for: e.target.value }))}
                    className="input-dark w-full text-sm" />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
                  className={`w-9 h-5 rounded-full transition-all relative ${form.pinned ? 'bg-[rgba(201,168,76,0.4)]' : 'bg-[rgba(255,255,255,0.08)]'}`}
                  style={{ border: `1px solid ${form.pinned ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${form.pinned ? 'left-[18px] bg-[#c9a84c]' : 'left-0.5 bg-[#5a5a66]'}`} />
                </div>
                <span className="text-[#8e8e9a] text-sm">Pin this announcement</span>
              </label>

              {/* ── Email notification ─────────────────────────────── */}
              <div className="pt-2 mt-2 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[#3a3a42] pt-3">Email Notification</p>
                <p className="text-[#5a5a66] text-xs -mt-2">
                  Sends the title/body above as an email. Independent of the on-site audience — pick who gets emailed here.
                </p>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Send To</label>
                  <select value={emailRecipient}
                    onChange={e => { setEmailRecipient(e.target.value); setTargetUser(null); setTargetQuery('') }}
                    className="input-dark w-full text-sm">
                    <option value="all">All Members</option>
                    <option value="free">Free Only</option>
                    <option value="gold">Gold Only</option>
                    <option value="admin">Admins Only</option>
                    <option value="specific">Specific Person</option>
                  </select>
                </div>

                {emailRecipient === 'specific' && (
                  <div>
                    {targetUser ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}>
                        <UserCircle2 size={14} className="text-[#c9a84c] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-medium truncate">{targetUser.full_name || 'Unnamed'}</p>
                          <p className="text-[#5a5a66] text-[11px] truncate">{targetUser.email}</p>
                        </div>
                        <button onClick={() => setTargetUser(null)} className="text-[#5a5a66] hover:text-white transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a66]" />
                        <input value={targetQuery} onChange={e => setTargetQuery(e.target.value)}
                          placeholder="Search by name or email…" className="input-dark w-full text-sm pl-8" />
                        {targetSearching && <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a66]" />}
                        {targetResults.length > 0 && (
                          <div className="mt-1.5 rounded-xl overflow-hidden max-h-48 overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,15,17,0.98)' }}>
                            {targetResults.map(u => (
                              <button key={u.id} onClick={() => { setTargetUser(u); setTargetQuery(''); setTargetResults([]) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(255,255,255,0.05)] transition-all">
                                <UserCircle2 size={13} className="text-[#5a5a66] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-white text-xs truncate">{u.full_name || 'Unnamed'}</p>
                                  <p className="text-[#5a5a66] text-[11px] truncate">{u.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPreview(v => !v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8e8e9a' }}>
                    <Eye size={13} /> {showPreview ? 'Hide Preview' : 'Preview Email'}
                  </button>
                  <button onClick={handleSendEmail} disabled={sendingEmail || !form.title || !form.body}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                    {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {sendingEmail ? 'Sending…' : 'Send Email'}
                  </button>
                </div>

                {showPreview && (
                  <iframe
                    title="Email preview"
                    srcDoc={announcementHtml(
                      escapeHtml(form.title || 'Announcement title'),
                      escapeHtml(form.body || 'Announcement content…'),
                      form.banner_url || null
                    )}
                    className="w-full h-[420px] rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.body}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

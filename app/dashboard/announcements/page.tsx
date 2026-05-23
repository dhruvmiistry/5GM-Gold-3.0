import { Bell, Megaphone, Settings, Star, Heart } from 'lucide-react'
import { mockAnnouncements } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/Badge'

const typeConfig: Record<string, { icon: React.ElementType; label: string; variant: 'gold' | 'green' | 'muted' | 'new' }> = {
  content: { icon: Bell, label: 'New Content', variant: 'green' },
  platform: { icon: Star, label: 'Platform', variant: 'gold' },
  update: { icon: Settings, label: 'Update', variant: 'muted' },
  welcome: { icon: Heart, label: 'Welcome', variant: 'new' },
}

export default function AnnouncementsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d]" />
          <span className="text-[#4caf7d] text-xs font-medium uppercase tracking-wider">Free Access</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Announcements</h1>
        <p className="text-[#5a5a66] text-sm">Platform updates, new content alerts, and team messages.</p>
      </div>

      <div className="space-y-4">
        {mockAnnouncements.map(announcement => {
          const config = typeConfig[announcement.type]
          const Icon = config?.icon ?? Megaphone
          return (
            <div
              key={announcement.id}
              className={`p-6 rounded-2xl card ${announcement.isNew ? 'border-[rgba(201,168,76,0.15)]' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  announcement.isNew
                    ? 'bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)]'
                    : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]'
                }`}>
                  <Icon size={15} className={announcement.isNew ? 'text-[#c9a84c]' : 'text-[#5a5a66]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-white font-medium text-sm">{announcement.title}</h3>
                    {announcement.isNew && <Badge variant="new">New</Badge>}
                    {config && (
                      <Badge variant={config.variant}>{config.label}</Badge>
                    )}
                  </div>
                  <p className="text-[#8e8e9a] text-sm leading-relaxed mb-3">
                    {announcement.body}
                  </p>
                  <span className="text-[#5a5a66] text-xs">{formatDate(announcement.date)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

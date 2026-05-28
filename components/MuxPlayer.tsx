'use client'

import MuxPlayerReact from '@mux/mux-player-react'

interface MuxPlayerProps {
  playbackId: string
  title?: string
  thumbnailUrl?: string
  accentColor?: string
}

export default function MuxPlayer({ playbackId, title, thumbnailUrl, accentColor = '#c9a84c' }: MuxPlayerProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.15)' }}>
      <MuxPlayerReact
        playbackId={playbackId}
        metadata={{ video_title: title }}
        poster={thumbnailUrl}
        accentColor={accentColor}
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  )
}

'use client'

import { useRef, useState, useCallback } from 'react'
import MuxPlayerReact from '@mux/mux-player-react'

interface MuxPlayerProps {
  playbackId: string
  title?: string
  thumbnailUrl?: string
  accentColor?: string
  onEnded?: () => void
}

interface QualityLevel {
  index: number   // HLS.js level index; -1 = Auto
  label: string   // e.g. "1080p"
  height: number
}

type MuxPlayerEl = HTMLElement & {
  _hls?: {
    levels?: Array<{ height: number; width: number; bitrate: number }>
    currentLevel: number
    nextLevel: number
  }
}

export default function MuxPlayer({ playbackId, title, thumbnailUrl, accentColor = '#c9a84c', onEnded }: MuxPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [qualities, setQualities] = useState<QualityLevel[]>([])
  const [activeQuality, setActiveQuality] = useState<number>(-1) // -1 = Auto

  // Fires once the HLS manifest is parsed and rendition levels are available.
  // _hls is the internal hls.js instance exposed by mux-player for advanced use.
  // On Safari (native HLS) _hls is undefined — selector simply stays hidden.
  const handleLoadedMetadata = useCallback(() => {
    const player = containerRef.current?.querySelector('mux-player') as MuxPlayerEl | null
    const levels = player?._hls?.levels
    if (!levels?.length) return

    // Deduplicate by height, highest quality first
    const seen = new Set<number>()
    const parsed: QualityLevel[] = []
    levels.forEach((level, index) => {
      if (level.height && !seen.has(level.height)) {
        seen.add(level.height)
        parsed.push({ index, label: `${level.height}p`, height: level.height })
      }
    })
    parsed.sort((a, b) => b.height - a.height)
    setQualities(parsed)
  }, [])

  const selectQuality = useCallback((index: number) => {
    const player = containerRef.current?.querySelector('mux-player') as MuxPlayerEl | null
    const hls = player?._hls
    if (!hls) return
    hls.currentLevel = index
    hls.nextLevel = index
    setActiveQuality(index)
  }, [])

  const btnStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }
      : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }

  return (
    <div>
      {/* Player */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <MuxPlayerReact
          playbackId={playbackId}
          metadata={{ video_title: title }}
          poster={thumbnailUrl}
          accentColor={accentColor}
          renditionOrder="desc"
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          style={{ width: '100%', aspectRatio: '16/9' }}
        />
      </div>

      {/* Custom quality selector — renders only when HLS.js exposes >1 rendition.
          On Safari (native HLS) _hls is undefined so this stays hidden. */}
      {qualities.length > 1 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-[#3a3a46]">Quality</span>

          <button
            onClick={() => selectQuality(-1)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
            style={btnStyle(activeQuality === -1)}
          >
            Auto
          </button>

          {qualities.map(q => (
            <button
              key={q.index}
              onClick={() => selectQuality(q.index)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={btnStyle(activeQuality === q.index)}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

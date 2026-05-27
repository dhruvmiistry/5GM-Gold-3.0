'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Candle = { open: number; high: number; low: number; close: number }

function generateCandle(prev: number): Candle {
  const change = (Math.random() - 0.46) * 10
  const open = prev
  const close = prev + change
  const high = Math.max(open, close) + Math.random() * 5
  const low = Math.min(open, close) - Math.random() * 5
  return { open, high, low, close }
}

function generateInitialCandles(count: number): Candle[] {
  const candles: Candle[] = []
  let price = 2318
  for (let i = 0; i < count; i++) {
    const c = generateCandle(price)
    candles.push(c)
    price = c.close
  }
  return candles
}

export default function HeroChart() {
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(32))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1].close
        return [...prev.slice(1), generateCandle(last)]
      })
      setTick(t => t + 1)
    }, 1400)
    return () => clearInterval(id)
  }, [])

  const W = 560
  const H = 320
  const PX = 8
  const PY = 16
  const cW = W - PX * 2
  const cH = H - PY * 2

  const prices = candles.flatMap(c => [c.high, c.low])
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const range = maxP - minP
  const pad = range * 0.15

  const toY = (p: number) => PY + cH - ((p - (minP - pad)) / (range + pad * 2)) * cH
  const spacing = cW / candles.length
  const bw = spacing * 0.55

  // 8-period MA
  const ma = candles.map((_, i) => {
    if (i < 7) return null
    const avg = candles.slice(i - 7, i + 1).reduce((s, c) => s + c.close, 0) / 8
    return { x: PX + i * spacing + spacing / 2, y: toY(avg) }
  }).filter(Boolean) as { x: number; y: number }[]
  const maPath = ma.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  const latest = candles[candles.length - 1]
  const latestPrice = latest?.close.toFixed(2)
  const isUp = latest?.close >= latest?.open

  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(12,11,10,0.95)', border: '1px solid rgba(201,168,76,0.18)', boxShadow: '0 0 0 1px rgba(201,168,76,0.06), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(201,168,76,0.06)' }}
    >
      {/* top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-white text-sm font-semibold tracking-wide">XAU / USD</span>
          <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <motion.span
            key={tick}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className={`text-base font-mono font-semibold ${isUp ? 'text-[#c9a84c]' : 'text-[#8e6a30]'}`}
          >
            {latestPrice}
          </motion.span>
          <div className="flex gap-1.5">
            {['1H', '4H', '1D'].map((t, i) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                style={i === 1
                  ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                  : { color: '#5a5a66' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-2 pb-3">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="candleGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Horizontal grid */}
          {[0.2, 0.4, 0.6, 0.8].map(t => (
            <line key={t} x1={PX} y1={PY + cH * t} x2={W - PX} y2={PY + cH * t}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Candle bodies + wicks */}
          {candles.map((c, i) => {
            const x = PX + i * spacing + spacing / 2
            const bull = c.close >= c.open
            const color = bull ? '#c9a84c' : 'rgba(180,130,50,0.45)'
            const bodyTop = toY(Math.max(c.open, c.close))
            const bodyH = Math.max(Math.abs(toY(c.open) - toY(c.close)), 1.5)
            const isLast = i === candles.length - 1

            return (
              <g key={i} filter={isLast ? 'url(#candleGlow)' : undefined}>
                <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)}
                  stroke={color} strokeWidth={isLast ? 1.5 : 1} opacity={bull ? 0.75 : 0.5} />
                <rect x={x - bw / 2} y={bodyTop} width={bw} height={bodyH}
                  fill={color} opacity={isLast ? 1 : bull ? 0.85 : 0.45} rx={1.5} />
              </g>
            )
          })}

          {/* MA line */}
          <path d={maPath} fill="none" stroke="rgba(201,168,76,0.45)"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#softGlow)" />

          {/* Latest price dashed line */}
          <line x1={PX} y1={toY(latest?.close ?? 0)} x2={W - PX} y2={toY(latest?.close ?? 0)}
            stroke="rgba(201,168,76,0.18)" strokeWidth="1" strokeDasharray="3 4" />
        </svg>
      </div>

      {/* Bottom stats bar */}
      <div className="flex items-center gap-6 px-5 py-3 border-t border-[rgba(255,255,255,0.04)]">
        {[
          { label: 'Open', value: latest?.open.toFixed(2) },
          { label: 'High', value: latest?.high.toFixed(2) },
          { label: 'Low', value: latest?.low.toFixed(2) },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[#3a3a46] text-[10px] uppercase tracking-wider">{s.label}</span>
            <span className="text-[#8e8e9a] text-[11px] font-mono">{s.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-[#5a5a66] text-[10px]">Updating live</span>
        </div>
      </div>
    </div>
  )
}

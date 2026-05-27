'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = 55
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    const CONNECT_DIST = 120
    const GOLD = '201,168,76'

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      // update positions
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${GOLD},${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // draw dots
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${GOLD},${p.opacity})`
        ctx.fill()

        // soft glow on larger dots
        if (p.radius > 1.8) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3)
          grad.addColorStop(0, `rgba(${GOLD},0.08)`)
          grad.addColorStop(1, `rgba(${GOLD},0)`)
          ctx.fillStyle = grad
          ctx.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,10,11,0.6)',
        border: '1px solid rgba(201,168,76,0.15)',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 32px 80px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.05)',
        aspectRatio: '4/3',
      }}
    >
      {/* top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)' }} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* centre badge */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a84c] opacity-60 mb-2">5GM Gold</div>
          <div className="text-white text-2xl font-semibold tracking-tight opacity-20" style={{ fontFamily: 'var(--font-inter)' }}>Private Platform</div>
        </div>
      </div>

      {/* corner stat chips */}
      <div className="absolute top-5 left-5 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(10,10,11,0.7)', border: '1px solid rgba(201,168,76,0.15)', backdropFilter: 'blur(8px)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-[#c9a84c] text-[10px] font-medium tracking-wide">4 Analysts</span>
        </div>
      </div>

      <div className="absolute top-5 right-5 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(10,10,11,0.7)', border: '1px solid rgba(201,168,76,0.15)', backdropFilter: 'blur(8px)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-[#c9a84c] text-[10px] font-medium tracking-wide">Free Access</span>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(10,10,11,0.7)', border: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(8px)' }}>
          <span className="text-[#5a5a66] text-[10px] tracking-wide">3 new videos every week</span>
        </div>
      </div>

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.4), transparent)' }} />
    </div>
  )
}

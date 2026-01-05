'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'

function hexToRGBA(hex, alpha = 0.08) {
  try {
    const normalized = hex.replace('#', '')
    const full = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized
    const bigint = parseInt(full, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return `rgba(0, 0, 0, ${alpha})`
  }
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / (24 * 3600))
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) }
}

export default function CountdownOffer({ days = 7, color = '#54a2b1' }) {
  const [expiry, setExpiry] = useState(null)
  const [now, setNow] = useState(Date.now())

  // Persist expiry across reloads
  useEffect(() => {
    try {
      const key = 'plansOfferExpiry'
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      let target = saved ? Number(saved) : null
      if (!target || Number.isNaN(target) || target < Date.now()) {
        target = Date.now() + days * 24 * 60 * 60 * 1000
        if (typeof window !== 'undefined') window.localStorage.setItem(key, String(target))
      }
      setExpiry(target)
    } catch (err) {
      // Fallback: 7 días desde ahora
      setExpiry(Date.now() + days * 24 * 60 * 60 * 1000)
    }
  }, [days])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeLeft = useMemo(() => {
    if (!expiry) return days * 24 * 60 * 60 * 1000
    return Math.max(0, expiry - now)
  }, [expiry, now, days])

  const { days: d, hours, minutes, seconds } = formatTime(timeLeft)

  return (
    <div
      className="mt-6 rounded-md border px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
      style={{ borderColor: color, backgroundColor: hexToRGBA(color, 0.10) }}
    >
      <div className="flex flex-col items-center justify-center sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left text-xs sm:text-sm leading-tight">
          <Clock className="h-4 w-4" style={{ color }} />
          <span className="font-bold">🔥 POR LANZAMIENTO: 50% de descuento en todos los planes 🔥</span>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 font-mono flex-wrap" role="timer" aria-live="polite">
          <span className="text-muted-foreground font-sans mr-1 sm:mr-2">Termina en:</span>
          <span className="inline-flex items-center justify-center rounded px-2 py-1 min-w-[34px] bg-black/5 dark:bg-white/10 text-[11px] sm:text-sm font-bold">{d}d</span>
          <span className="inline-flex items-center justify-center rounded px-2 py-1 min-w-[34px] bg-black/5 dark:bg-white/10 text-[11px] sm:text-sm font-bold">{hours}h</span>
          <span className="inline-flex items-center justify-center rounded px-2 py-1 min-w-[34px] bg-black/5 dark:bg-white/10 text-[11px] sm:text-sm font-bold">{minutes}m</span>
          <span className="inline-flex items-center justify-center rounded px-2 py-1 min-w-[34px] bg-black/5 dark:bg-white/10 text-[11px] sm:text-sm font-bold">{seconds}s</span>
        </div>
      </div>
    </div>
  )
}
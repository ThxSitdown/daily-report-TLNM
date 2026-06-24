'use client'
import { useEffect, useRef, useState } from 'react'

export function useDraft<T>(hotelType: string, def: T) {
  const [data, setData] = useState<T>(def)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const skip = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetch(`/api/drafts?hotelType=${encodeURIComponent(hotelType)}`)
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setData(d as T) })
      .catch(() => {})
      .finally(() => { setLoaded(true); setTimeout(() => { skip.current = false }, 800) })
  }, [hotelType])

  useEffect(() => {
    if (!loaded || skip.current) return
    clearTimeout(timer.current)
    setSaving(true)
    timer.current = setTimeout(async () => {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelType, data })
      }).catch(() => {})
      setSaving(false)
    }, 2000)
    return () => clearTimeout(timer.current)
  }, [data, loaded, hotelType])

  const clearDraft = () =>
    fetch(`/api/drafts?hotelType=${encodeURIComponent(hotelType)}`, { method: 'DELETE' }).catch(() => {})

  return { data, setData, loaded, saving, clearDraft }
}

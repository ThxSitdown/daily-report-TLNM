'use client'
import { useEffect, useRef, useState } from 'react'

export function useDraft<T>(hotelType: string, defaultData: T) {
  const [data, setData] = useState<T>(defaultData)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const skipSave = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  // Load draft from server on mount
  useEffect(() => {
    fetch(`/api/drafts?hotelType=${encodeURIComponent(hotelType)}`)
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setData(d as T) })
      .catch(() => {})
      .finally(() => {
        setLoaded(true)
        // Allow auto-save after state settles
        setTimeout(() => { skipSave.current = false }, 800)
      })
  }, [hotelType])

  // Auto-save with 2-second debounce
  useEffect(() => {
    if (!loaded || skipSave.current) return
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
    fetch(`/api/drafts?hotelType=${encodeURIComponent(hotelType)}`, { method: 'DELETE' })
      .catch(() => {})

  return { data, setData, loaded, saving, clearDraft }
}

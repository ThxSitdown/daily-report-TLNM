'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser { userId: string; username: string; role: string }

export function useAuth(opts?: { requireAdmin?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.replace('/login'); return }
        if (opts?.requireAdmin && d.role !== 'admin') { router.replace('/select'); return }
        setUser(d); setLoading(false)
      })
      .catch(() => router.replace('/login'))
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return { user, loading, logout }
}

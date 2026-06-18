import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SECRET = process.env.JWT_SECRET || 'travelodge-daily-report-secret-2024'

export interface SessionUser {
  userId: string
  username: string
  role: string
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): SessionUser {
  return jwt.verify(token, SECRET) as SessionUser
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}
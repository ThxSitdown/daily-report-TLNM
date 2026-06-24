import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.JWT_SECRET || 'travelodge-daily-2024-secret-key-32c'

export interface SessionUser { userId: string; username: string; role: string }

export function signToken(p: SessionUser): string {
  return jwt.sign(p, SECRET, { expiresIn: '7d' })
}
export function verifyToken(token: string): SessionUser {
  return jwt.verify(token, SECRET) as SessionUser
}
export function getSession(req: NextRequest): SessionUser | null {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch { return null }
}

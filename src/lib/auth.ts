import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

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

// ✅ อ่านจาก NextRequest โดยตรง — ทำงานได้แน่นอนใน App Router Route Handlers
export function getSession(req: NextRequest): SessionUser | null {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

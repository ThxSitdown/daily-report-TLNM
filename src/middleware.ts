import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = ['/login', '/api/auth/login', '/api/seed']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // อนุญาต public routes และ static files
  if (
    PUBLIC.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) return NextResponse.next()

  // ตรวจ token
  const token = req.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    verifyToken(token)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

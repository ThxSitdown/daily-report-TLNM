import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/login', '/api/auth/', '/api/seed', '/_next', '/favicon']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  const token = req.cookies.get('auth_token')?.value
  if (!token || token.split('.').length !== 3) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    if (token) res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return res
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }

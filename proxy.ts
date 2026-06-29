import { NextResponse, type NextRequest } from 'next/server'

const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
)

// Optimistic session check — look for a Supabase auth cookie without calling
// the Supabase server. Per Next.js 16 docs, proxy should NOT do slow data
// fetching; actual auth verification happens inside page/API code.
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )
}

export function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next()

  const path = request.nextUrl.pathname
  const loggedIn = hasSessionCookie(request)

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/signup') && loggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect /dashboard routes
  if (path.startsWith('/dashboard') && !loggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /admin routes (optimistic — role check happens server-side)
  if (path.startsWith('/admin') && !loggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

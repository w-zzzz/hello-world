import { clerkMiddleware } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// In dev mode, skip Clerk entirely.
const authMode = process.env.QA_AUTH_MODE ?? 'dev'

const handler =
  authMode === 'clerk'
    ? clerkMiddleware((_auth, req) => intlMiddleware(req as unknown as NextRequest))
    : intlMiddleware

export default handler

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

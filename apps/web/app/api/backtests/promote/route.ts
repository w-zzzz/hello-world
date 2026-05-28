import { NextResponse } from 'next/server'
import { runBacktest } from '@/app/actions/backtests'
import { getCurrentUser } from '@/lib/auth'

interface PromoteBody {
  code?: string
  params?: Record<string, string | number>
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as PromoteBody | null
  if (!body?.code || typeof body.code !== 'string') {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }
  if (body.code.length > 65_536) {
    return NextResponse.json({ error: 'oversized_code' }, { status: 413 })
  }

  // Temporary cross-agent adapter for the M6 wave: the api+schemas agent is
  // shipping `{ code }` on POST /backtests/ in parallel. Until that lands,
  // we tunnel the user code through params with a `__code__` preset marker.
  // When the FastAPI side accepts `code` directly, switch the server action
  // to forward it as a first-class field.
  const out = await runBacktest({
    preset: '__code__',
    params: { ...(body.params ?? {}), __code: body.code },
  })
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 })
  return NextResponse.json({ runId: out.runId })
}

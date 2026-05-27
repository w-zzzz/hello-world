import type { Locale } from '@quant-academy/i18n'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@quant-academy/ui'
import { ArrowRight, FlaskConical, Play } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { listPresets, listRecentRuns, type PresetMeta, runBacktest } from '@/app/actions/backtests'
import { Link } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth'

function paramDefault(spec: PresetMeta['params'][string]): string {
  return String(spec.default)
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toISOString().slice(0, 16).replace('T', ' ')
}

function statusBadge(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'failed':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'running':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default async function WorkshopPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  const user = await getCurrentUser()
  const [presets, recent] = await Promise.all([
    listPresets(),
    user ? listRecentRuns(10) : Promise.resolve([]),
  ])

  async function submit(formData: FormData) {
    'use server'
    const preset = String(formData.get('preset') ?? '')
    if (!preset) return
    const paramsJson = String(formData.get('params_json') ?? '{}')
    let parsed: Record<string, string | number> = {}
    try {
      const obj = JSON.parse(paramsJson) as Record<string, unknown>
      const out: Record<string, string | number> = {}
      // Overlay any per-field values from the form (they override the defaults).
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'number' || typeof v === 'string') out[k] = v
      }
      for (const [k] of formData.entries()) {
        if (k === 'preset' || k === 'params_json') continue
        if (!k.startsWith('param_')) continue
        const name = k.slice('param_'.length)
        const raw = String(formData.get(k) ?? '')
        const asNum = Number(raw)
        out[name] = raw === '' || Number.isNaN(asNum) ? raw : asNum
      }
      parsed = out
    } catch {
      parsed = {}
    }
    const result = await runBacktest({ preset, params: parsed })
    if (result.ok) {
      redirect(`/${locale}/workshop/${result.runId}`)
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('workshop.title')}</h1>
        <p className="text-muted-foreground">{t('workshop.subtitle')}</p>
      </header>

      {!user && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm">
          <span className="text-muted-foreground">{t('workshop.signInPrompt')}</span>
          <Button asChild size="sm">
            <Link href="/sign-in">{t('auth.signIn')}</Link>
          </Button>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('workshop.pickPreset')}
        </h2>
        {presets.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No presets available.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {presets.map((preset) => {
              const displayName = locale === 'zh' ? preset.name_zh : preset.name_en
              const displayDesc = locale === 'zh' ? preset.description_zh : preset.description_en
              const defaults: Record<string, string | number> = {}
              for (const [k, spec] of Object.entries(preset.params)) {
                defaults[k] = spec.default
              }
              return (
                <li key={preset.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="size-4" aria-hidden="true" />
                        {displayName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{displayDesc}</p>
                    </CardHeader>
                    <CardContent>
                      <form action={submit} className="space-y-4">
                        <input type="hidden" name="preset" value={preset.id} />
                        <input type="hidden" name="params_json" value={JSON.stringify(defaults)} />
                        {Object.entries(preset.params).length > 0 && (
                          <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t('workshop.params')}
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {Object.entries(preset.params).map(([name, spec]) => (
                                <ParamField key={name} name={name} spec={spec} />
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          type="submit"
                          className="inline-flex items-center gap-2"
                          disabled={!user}
                        >
                          <Play className="size-4" aria-hidden="true" />
                          {t('workshop.run')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {user && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('workshop.recent')}
          </h2>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              —
            </div>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                    <span className="font-mono">{r.preset ?? 'custom'}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatDate(r.queuedAt)}
                    </span>
                  </div>
                  <Link
                    href={`/workshop/${r.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
                  >
                    Open <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

function ParamField({ name, spec }: { name: string; spec: PresetMeta['params'][string] }) {
  const fieldName = `param_${name}`
  if (spec.kind === 'enum' && spec.options) {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-mono">{name}</span>
        <select
          name={fieldName}
          defaultValue={paramDefault(spec)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {spec.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }
  const step = spec.step ?? (spec.kind === 'int' ? 1 : 0.1)
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex items-center justify-between font-mono">
        <span>{name}</span>
        <span className="text-muted-foreground tabular-nums">{String(spec.default)}</span>
      </span>
      <input
        type="number"
        name={fieldName}
        defaultValue={paramDefault(spec)}
        min={spec.min}
        max={spec.max}
        step={step}
        className="rounded-md border bg-background px-2 py-1.5 text-sm tabular-nums"
      />
    </label>
  )
}

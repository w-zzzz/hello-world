import { signInAsTestUser } from '@quant-academy/auth/server'
import type { Locale } from '@quant-academy/i18n'
import { Button } from '@quant-academy/ui'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

const authMode = process.env.QA_AUTH_MODE ?? 'dev'

export default async function SignUpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  if (authMode === 'clerk') {
    const { SignUp } = await import('@clerk/nextjs')
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <SignUp routing="path" path={`/${locale}/sign-up`} />
      </main>
    )
  }

  async function action(formData: FormData) {
    'use server'
    const display = String(formData.get('display') ?? '').trim() || undefined
    await signInAsTestUser(display)
    redirect(`/${locale}/profile`)
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">{t('auth.signUp')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('auth.devTestUser')}</p>
      <form action={action} className="space-y-3">
        <input
          type="text"
          name="display"
          placeholder="Test User"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" className="w-full">
          {t('auth.signUp')}
        </Button>
      </form>
    </main>
  )
}

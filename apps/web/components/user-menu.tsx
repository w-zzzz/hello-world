import { Button } from '@quant-academy/ui'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { signOutAction } from '@/app/actions/auth'
import { Link } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth'

export async function UserMenu() {
  const user = await getCurrentUser()
  const t = await getTranslations()

  if (!user) {
    return (
      <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-sm hover:underline">
        <LogIn className="size-4" aria-hidden="true" />
        <span>{t('auth.signIn')}</span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/profile" className="inline-flex items-center gap-1.5 hover:underline">
        <UserIcon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{user.displayName}</span>
      </Link>
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="inline-flex items-center gap-1.5"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('auth.signOut')}</span>
        </Button>
      </form>
    </div>
  )
}

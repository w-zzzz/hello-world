'use client'

import { Button } from '@quant-academy/ui'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const next = locale === 'zh' ? 'en' : 'zh'
  const label = locale === 'zh' ? 'English' : '中文'

  return (
    <Button asChild variant="ghost" size="sm" title="中文 / English">
      <Link href={pathname} locale={next}>
        {label}
      </Link>
    </Button>
  )
}

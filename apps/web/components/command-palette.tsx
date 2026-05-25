'use client'

import { CURRICULUM, TRACKS } from '@quant-academy/content'
import { Command } from 'cmdk'
import {
  Compass,
  GraduationCap,
  Home,
  Languages,
  LayoutDashboard,
  Moon,
  Sun,
  User,
  Wrench,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

const THEME_STORAGE_KEY = 'qa-theme'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const goToLesson = useCallback(
    (lessonId: string) => {
      router.push({ pathname: '/lessons/[lessonId]', params: { lessonId } })
      close()
    },
    [router, close],
  )

  const goToTrack = useCallback(
    (trackId: string) => {
      router.push({ pathname: '/lessons/[trackId]', params: { trackId } })
      close()
    },
    [router, close],
  )

  const goTo = useCallback(
    (path: '/' | '/lessons' | '/indicators' | '/workshop' | '/tutor' | '/profile') => {
      router.push(path)
      close()
    },
    [router, close],
  )

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    const isDark = root.classList.toggle('dark')
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      // Ignore storage failures (e.g. private browsing).
    }
    close()
  }, [close])

  const switchLocale = useCallback(() => {
    const nextLocale = locale === 'zh' ? 'en' : 'zh'
    router.replace(pathname, { locale: nextLocale })
    close()
  }, [locale, pathname, router, close])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close command palette"
        className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-sm"
        onClick={close}
      />
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command palette"
        className="fixed left-1/2 top-[20%] z-50 w-[640px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-xl border bg-card shadow-2xl"
      >
        <Command.Input
          placeholder={t('cmdk.placeholder')}
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="p-4 text-sm text-muted-foreground">No matches.</Command.Empty>

          <Command.Group
            heading={t('cmdk.groups.tracks')}
            className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {TRACKS.map((track) => (
              <Command.Item
                key={track.id}
                value={`track ${track.id} ${t(track.titleKey)}`}
                onSelect={() => goToTrack(track.id)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
              >
                <Compass className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-mono text-xs">Track {track.id}</span>
                <span className="truncate">{t(track.titleKey)}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading={t('cmdk.groups.lessons')}
            className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {CURRICULUM.lessons.map((lesson) => {
              const searchValue = [lesson.meta.id, lesson.meta.module, ...lesson.meta.tags].join(
                ' ',
              )
              return (
                <Command.Item
                  key={lesson.meta.id}
                  value={searchValue}
                  onSelect={() => goToLesson(lesson.meta.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
                >
                  <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-mono text-xs text-muted-foreground">{lesson.meta.id}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {lesson.meta.module}
                  </span>
                </Command.Item>
              )
            })}
          </Command.Group>

          <Command.Group
            heading={t('cmdk.groups.actions')}
            className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            <Command.Item
              value="toggle theme dark light"
              onSelect={toggleTheme}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <Sun className="h-4 w-4 text-muted-foreground dark:hidden" aria-hidden="true" />
              <Moon
                className="hidden h-4 w-4 text-muted-foreground dark:block"
                aria-hidden="true"
              />
              <span>Toggle theme</span>
            </Command.Item>
            <Command.Item
              value="switch locale language zh en chinese english"
              onSelect={switchLocale}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Switch locale</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {locale === 'zh' ? '→ English' : '→ 中文'}
              </span>
            </Command.Item>
            <Command.Item
              value="go dashboard home"
              onSelect={() => goTo('/')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Dashboard</span>
            </Command.Item>
            <Command.Item
              value="go lessons tracks"
              onSelect={() => goTo('/lessons')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Lessons</span>
            </Command.Item>
            <Command.Item
              value="go indicators"
              onSelect={() => goTo('/indicators')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <Compass className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Indicators (M2)</span>
            </Command.Item>
            <Command.Item
              value="go workshop"
              onSelect={() => goTo('/workshop')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Workshop (M5)</span>
            </Command.Item>
            <Command.Item
              value="go tutor ai"
              onSelect={() => goTo('/tutor')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Tutor (M4)</span>
            </Command.Item>
            <Command.Item
              value="go profile"
              onSelect={() => goTo('/profile')}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Go to Profile (M3)</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  )
}

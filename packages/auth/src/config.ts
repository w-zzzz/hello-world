import type { AuthMode } from './types'

export function getAuthMode(): AuthMode {
  const v = process.env.QA_AUTH_MODE
  if (v === 'clerk') return 'clerk'
  return 'dev'
}

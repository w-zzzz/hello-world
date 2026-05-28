import type { AuthMode } from './types'

class AuthConfigError extends Error {}

export function getAuthMode(): AuthMode {
  const v = process.env.QA_AUTH_MODE
  if (v === 'clerk') return 'clerk'
  if (v === 'dev') return 'dev'

  // Fail closed in production: explicit value required.
  // dev / CI may omit the var and get dev mode; prod cannot.
  if (process.env.NODE_ENV === 'production') {
    throw new AuthConfigError(
      "QA_AUTH_MODE must be set to 'clerk' (or explicitly 'dev') in production; " +
        `got ${v === undefined ? '<unset>' : JSON.stringify(v)}.`,
    )
  }
  return 'dev'
}

export { AuthConfigError }

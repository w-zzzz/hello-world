export type AuthMode = 'dev' | 'clerk'

export interface AuthUser {
  id: string // UUID from users table
  handle: string
  displayName: string
  locale: 'zh' | 'en'
  createdAt: Date
}

import { vi } from 'vitest'

// `server-only` throws unless evaluated inside a Next.js server component.
// Stub it for the test runtime.
vi.mock('server-only', () => ({}))

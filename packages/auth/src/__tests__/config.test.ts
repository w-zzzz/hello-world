import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthConfigError, getAuthMode } from '../config'

// process.env.NODE_ENV is typed as readonly under @types/node ≥ 20.
// Helper that always points at the live process.env so afterEach restoration
// (which replaces the object reference) is honoured by subsequent writes.
const env = () => process.env as Record<string, string | undefined>
const originalEnv = { ...process.env }

describe('getAuthMode', () => {
  beforeEach(() => {
    delete env().QA_AUTH_MODE
    delete env().NODE_ENV
  })
  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("returns 'clerk' when QA_AUTH_MODE='clerk'", () => {
    env().QA_AUTH_MODE = 'clerk'
    expect(getAuthMode()).toBe('clerk')
  })

  it("returns 'dev' when QA_AUTH_MODE='dev'", () => {
    env().QA_AUTH_MODE = 'dev'
    expect(getAuthMode()).toBe('dev')
  })

  it("returns 'dev' when unset and NODE_ENV is not production", () => {
    env().NODE_ENV = 'development'
    expect(getAuthMode()).toBe('dev')
  })

  it('throws in production when QA_AUTH_MODE is unset', () => {
    env().NODE_ENV = 'production'
    expect(() => getAuthMode()).toThrow(AuthConfigError)
  })

  it("throws in production when QA_AUTH_MODE is a typo'd value", () => {
    env().NODE_ENV = 'production'
    env().QA_AUTH_MODE = 'develop'
    expect(() => getAuthMode()).toThrow(AuthConfigError)
  })

  it('error message names the offending value', () => {
    env().NODE_ENV = 'production'
    env().QA_AUTH_MODE = 'oops'
    expect(() => getAuthMode()).toThrow(/oops/)
  })
})

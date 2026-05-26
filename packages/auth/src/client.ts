'use client'
import { getAuthMode } from './config'

// Re-export Clerk components when present. If @clerk/nextjs is not installed
// in the runtime image, these throw on access; consumers should guard.
export async function loadClerkComponents() {
  if (getAuthMode() !== 'clerk') return null
  return import('@clerk/nextjs')
}

export { getAuthMode }

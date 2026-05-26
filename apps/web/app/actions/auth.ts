'use server'

import { signInAsTestUser, signOut } from '@/lib/auth'

export async function signInAsTestUserAction(displayName?: string) {
  return signInAsTestUser(displayName)
}

export async function signOutAction() {
  return signOut()
}

'use client'

import { signOut } from '@/lib/auth/actions'

export function SignOutButton(): React.JSX.Element {
  return (
    <button
      onClick={() => signOut()}
      className="w-full text-left text-sm px-2 py-1.5 text-destructive hover:bg-accent rounded-sm cursor-pointer"
    >
      Sign out
    </button>
  )
}

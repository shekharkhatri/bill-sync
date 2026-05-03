"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth/actions"

export function SignOutMenuItem(): React.JSX.Element {
  return (
    <DropdownMenuItem onSelect={() => signOut()}>
      Sign out
    </DropdownMenuItem>
  )
}

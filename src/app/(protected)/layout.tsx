import { requireSession } from "@/lib/auth/session"
import { getUserWithRole } from "@/lib/auth/session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton } from "@/components/shared/SignOutButton"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  await requireSession()
  const user = await getUserWithRole()

  const initials = user?.name?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card h-[52px]">
        <div className="container mx-auto px-8 flex h-full items-center justify-between">
          <div className="flex items-center">
            <span className="text-base font-bold tracking-[-0.02em]">
              <span className="text-blue-600">Bill</span><span className="text-blue-400">Sync</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user?.name && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.name}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="cursor-pointer size-8">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal text-muted-foreground text-xs truncate">
                    {user?.email}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">{children}</main>
    </div>
  )
}

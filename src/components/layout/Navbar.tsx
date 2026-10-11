"use client";

import Link from "next/link";
import { LifeBuoy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button } from "@/lib/ui-helpers";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          </span>
          TicketDesk <span className="text-primary">Pro</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <div className="mr-2 hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-xs leading-tight text-muted-foreground">{user.roles.join(" · ")}</p>
            </div>
          )}
          <NotificationBell />
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

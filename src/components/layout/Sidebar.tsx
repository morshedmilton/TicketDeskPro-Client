"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Inbox,
  LayoutDashboard,
  ScrollText,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Extra roles beyond the baseline set. */
  roles?: string[];
}

const AGENT_ROLES = ["Agent", "Admin", "SuperAdmin"];
const ADMIN_ROLES = ["Admin", "SuperAdmin"];

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tickets", label: "My Tickets", icon: Inbox },
      { href: "/tickets/queue", label: "Agent Queue", icon: Gauge, roles: AGENT_ROLES },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, roles: ADMIN_ROLES },
      { href: "/admin/sla-policies", label: "SLA Policies", icon: Settings, roles: ADMIN_ROLES },
      { href: "/admin/categories", label: "Categories & Tags", icon: Tags, roles: ADMIN_ROLES },
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ADMIN_ROLES },
    ],
  },
];

/** Role-based navigation (FRD): items appear only when the user's roles allow. */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const visible = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || item.roles.some((role) => roles.includes(role)),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <nav className="flex flex-col gap-6 p-4" aria-label="Main navigation">
        {visible.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4" aria-hidden={true} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

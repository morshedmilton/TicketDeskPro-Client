"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { ticketsApi } from "@/lib/tickets";
import { Button, Card, Input, Label } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import type { TicketPriority, TicketStatus } from "@/types";

const STATUSES: TicketStatus[] = ["Open", "InProgress", "AwaitingCustomer", "CustomerReplied", "Resolved", "Closed", "Reopened"];
const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];
const SORTS = [
  { value: "createdAt", label: "Newest" },
  { value: "updatedAt", label: "Recently updated" },
  { value: "priority", label: "Priority" },
];

export default function TicketsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [sort, setSort] = useState("createdAt");
  const [cursors, setCursors] = useState<string[]>([]); // stack of visited pages
  const cursor = cursors[cursors.length - 1];
  const [version, setVersion] = useState(0);
  const { user } = useAuth();
  const isAgentLike = useMemo(
    () => (user?.roles ?? []).some((r) => r === "Agent" || r === "Admin" || r === "SuperAdmin"),
    [user?.roles],
  );

  // 300ms debounce — one request per pause, not per keystroke (L7).
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Real-time: any SignalR notification refetches the list (US-7.02).
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    window.addEventListener("tdp-toast", listener);
    return () => window.removeEventListener("tdp-toast", listener);
  }, []);

  const { data, error, isLoading } = useQuery(
    () =>
      ticketsApi.list({
        search: debouncedSearch,
        status: status || undefined,
        priority: priority || undefined,
        sort,
        cursor,
        // "My Tickets" means mine: assigned for agents, submitted for customers (M1).
        assignedTo: isAgentLike ? user?.id : undefined,
      }),
    [debouncedSearch, status, priority, sort, cursor, version, isAgentLike, user?.id],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-sm text-muted-foreground">Every request you&apos;ve submitted, newest first.</p>
        </div>
        <Button onClick={() => router.push("/tickets/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Ticket
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="search" placeholder="Title or TKT number" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setCursors([]); }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" value={status} onChange={(e) => { setStatus(e.target.value as TicketStatus | ""); setCursors([]); }}
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <select id="priority" value={priority} onChange={(e) => { setPriority(e.target.value as TicketPriority | ""); setCursors([]); }}
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sort">Sort by</Label>
            <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value); setCursors([]); }}
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading tickets…</p>
      ) : !data || data.items.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">No tickets match.</p>
          <p className="mt-1 text-sm text-muted-foreground">Adjust the filters, or submit a new request.</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/tickets/new")}>Create the first ticket</Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border p-0">
          <ul>
            {data.items.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className={cn("flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60")}
                >
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{ticket.title}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="hidden w-32 truncate text-right text-xs text-muted-foreground sm:block">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data && (data.hasMore || cursors.length > 0) && (
        <div className="flex justify-between">
          <Button variant="outline" size="sm" disabled={cursors.length === 0} onClick={() => setCursors((c) => c.slice(0, -1))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!data.hasMore || !data.nextCursor} onClick={() => setCursors((c) => [...c, data.nextCursor!])}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

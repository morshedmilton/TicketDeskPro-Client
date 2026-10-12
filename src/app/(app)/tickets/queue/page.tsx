"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { ticketsApi } from "@/lib/tickets";
import { Button, Card } from "@/lib/ui-helpers";
import { useAuth } from "@/contexts/AuthContext";

/** Agent queue (US-6.03): claim the newest open tickets yourself. */
export default function QueuePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [version, setVersion] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  // Real-time queue: new unclaimed tickets appear without a refresh (M4).
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    window.addEventListener("tdp-toast", listener);
    return () => window.removeEventListener("tdp-toast", listener);
  }, []);

  const { data, error, refetch } = useQuery(
    () => ticketsApi.list({ status: "Open", sort: "createdAt", limit: 25 }),
    [version],
  );

  async function claim(ticketId: string, etag: string) {
    if (!user) return;
    setActionError(null);
    try {
      await ticketsApi.assign(ticketId, etag, user.id); // claim = assign self -> In Progress
      refetch();
    } catch (err) {
      setActionError(toApiError(err).message); // M5: no blocking alert()
    }
  }

  const unassigned = (data?.items ?? []).filter((t) => !t.assignedToId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Queue</h1>
        <p className="text-sm text-muted-foreground">Unclaimed Open tickets — click Claim to take one (status moves to In Progress).</p>
      </div>

      {(error || actionError) && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error ?? actionError}</p>
      )}

      {unassigned.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Queue is empty — nice work.</p>
          <p className="text-sm text-muted-foreground">New unassigned tickets will appear here in real time.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border p-0">
          <ul>
            {unassigned.map((ticket) => (
              <li key={ticket.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link href={`/tickets/${ticket.id}`} className="min-w-0 flex-1">
                  <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                  <p className="truncate text-sm font-medium hover:underline">{ticket.title}</p>
                </Link>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <Button size="sm" onClick={() => void claim(ticket.id, ticket.etag)}>Claim</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button variant="outline" onClick={() => router.push("/tickets")}>View all my tickets</Button>
    </div>
  );
}

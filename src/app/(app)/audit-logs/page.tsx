"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@/hooks/useQuery";
import { auditApi } from "@/lib/admin";
import { Button, Card, Input, Label } from "@/lib/ui-helpers";

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ entityType: "", action: "", from: "", to: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors[cursors.length - 1];

  const { data, error } = useQuery(
    () =>
      auditApi.list({
        entityType: filters.entityType || undefined,
        action: filters.action || undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
        limit: 25,
        cursor,
      }),
    [filters, cursor],
  );

  const ACTION_COLOR: Record<string, string> = {
    Create: "bg-emerald-100 text-emerald-800",
    Update: "bg-amber-100 text-amber-800",
    Delete: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Immutable record of every change (US-9.02). Expand a row to see the before/after snapshot.</p>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="entityType">Entity</Label>
          <select id="entityType" value={filters.entityType} onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setCursors([]); }}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
            <option value="">All</option>
            {["Ticket", "TicketStatusHistory", "User", "Category", "Tag", "Role", "SlaPolicy"].map((entity) => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action">Action</Label>
          <select id="action" value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setCursors([]); }}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring">
            <option value="">All</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setCursors([]); }} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setCursors([]); }} />
        </div>
      </Card>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="divide-y divide-border p-0">
        <ul>
          {(data?.items ?? []).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-muted/60"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                aria-expanded={expanded === row.id}
              >
                {expanded === row.id
                  ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLOR[row.action] ?? "bg-muted"}`}>{row.action}</span>
                <span className="w-36 shrink-0 text-sm font-medium">{row.entityType}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{row.entityId}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{row.userName ?? "system"}</span>
                <span className="w-40 shrink-0 text-right text-xs text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</span>
              </button>
              {expanded === row.id && (
                <div className="grid gap-3 border-t border-border bg-muted/40 px-4 py-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-card p-3 text-xs">{row.beforeJson ?? "—"}</pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">After</p>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-card p-3 text-xs">{row.afterJson ?? "—"}</pre>
                  </div>
                </div>
              )}
            </li>
          ))}
          {(data?.items ?? []).length === 0 && (
            <li className="py-10 text-center text-sm text-muted-foreground">No audit entries match these filters.</li>
          )}
        </ul>
      </Card>

      {data && (data.hasMore || cursors.length > 0) && (
        <div className="flex justify-between">
          <Button variant="outline" size="sm" disabled={cursors.length === 0} onClick={() => setCursors((c) => c.slice(0, -1))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setCursors((c) => [...c, data.nextCursor!])}>Next</Button>
        </div>
      )}
    </div>
  );
}

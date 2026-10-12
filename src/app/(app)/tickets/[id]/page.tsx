"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Lock, Pencil, Send, Shield, Trash2 } from "lucide-react";
import { PriorityBadge, SlaBar, StatusBadge } from "@/components/tickets/Badges";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { catalogApi } from "@/lib/admin";
import { downloadAttachment, ticketsApi } from "@/lib/tickets";
import { Button, Card, CardTitle, Input, Label } from "@/lib/ui-helpers";
import { cn } from "@/lib/utils";
import type { TicketDetail, TicketPriority, TicketStatus } from "@/types";

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open: ["InProgress"],
  InProgress: ["AwaitingCustomer", "Resolved"],
  AwaitingCustomer: ["CustomerReplied"],
  CustomerReplied: ["InProgress"],
  Resolved: ["Closed", "Reopened"],
  Reopened: ["InProgress"],
  Closed: [],
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const { user } = useAuth();
  const isAgentLike = useMemo(
    () => (user?.roles ?? []).some((r) => r === "Agent" || r === "Admin" || r === "SuperAdmin"),
    [user?.roles],
  );
  const isAdmin = useMemo(
    () => (user?.roles ?? []).some((r) => r === "Admin" || r === "SuperAdmin"),
    [user?.roles],
  );

  const [version, setVersion] = useState(0); // manual refetch trigger for real-time updates
  const [editingMeta, setEditingMeta] = useState(false);
  const { data: ticket, error } = useQuery<TicketDetail>(() => ticketsApi.get(ticketId), [ticketId, version]);
  const { data: messages } = useQuery(() => ticketsApi.messages(ticketId, { limit: 100 }), [ticketId, version]);
  const { data: attachments } = useQuery(() => ticketsApi.attachments(ticketId), [ticketId, version]);

  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Real-time: any SignalR event bumps our version -> every query refetches.
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    window.addEventListener("tdp-toast", listener);
    return () => window.removeEventListener("tdp-toast", listener);
  }, []);

  async function guard(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await guard(async () => {
      await ticketsApi.addMessage(ticketId, reply, isInternal);
      setReply("");
      setIsInternal(false);
    });
  }

  if (error) return <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>;
  if (!ticket) return <p className="py-12 text-center text-sm text-muted-foreground">Loading ticket…</p>;

  // Agents follow the full state machine; a customer gets exactly the BR-016 move:
  // their own ticket sitting in AwaitingCustomer -> CustomerReplied.
  const allowedTransitions: TicketStatus[] = isAgentLike
    ? TRANSITIONS[ticket.status]
    : ticket.status === "AwaitingCustomer" && ticket.createdById === user?.id
      ? ["CustomerReplied"]
      : [];
  const canEditMetadata = isAgentLike && (ticket.status === "Open" || ticket.status === "InProgress");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ---------- thread column ---------- */}
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{ticket.description}</p>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Conversation</h2>
          <ul className="space-y-3">
            {(messages?.items ?? []).map((message) => (
              <li
                key={message.id}
                className={cn(
                  "rounded-xl p-3 text-sm",
                  message.isInternal ? "border border-amber-300 bg-amber-50" : "bg-muted",
                )}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    {message.createdByName}
                    {message.isInternal && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 font-medium text-amber-900">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Internal
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </li>
            ))}
            {(messages?.items ?? []).length === 0 && (
              <li className="py-4 text-center text-sm text-muted-foreground">No messages yet — say hello.</li>
            )}
          </ul>

          <form onSubmit={onReply} className="mt-4 space-y-3 border-t border-border pt-4">
            <Label htmlFor="reply">Your reply</Label>
            <textarea
              id="reply"
              rows={3}
              required
              maxLength={5000}
              placeholder="Type a reply…"
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            {isAgentLike && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Internal note — hidden from the customer
              </label>
            )}
            <Button type="submit" disabled={busy || reply.trim().length === 0}>
              <Send className="h-4 w-4" aria-hidden="true" />
              {isInternal ? "Add note" : "Send reply"}
            </Button>
          </form>
        </Card>
      </div>

      {/* ---------- sidebar ---------- */}
      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <CardTitle className="text-base">SLA</CardTitle>
            <p className="text-sm text-muted-foreground">Deadlines set when the ticket was created.</p>
          </div>
          <SlaBar sla={ticket.sla} createdAt={ticket.createdAt} />
        </Card>

        <Card className="space-y-4">
          <CardTitle className="text-base">Details</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{ticket.categoryName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Created by</dt><dd className="font-medium">{ticket.createdByName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Assigned to</dt><dd className="font-medium">{ticket.assignedToName ?? "Unassigned"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</dd></div>
            {ticket.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </dl>
        </Card>

        {isAgentLike && (
          <Card className="space-y-3">
            <CardTitle className="text-base">Actions</CardTitle>

            {allowedTransitions.length > 0 && (
              <div className="space-y-2">
                <Label>Move to</Label>
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        guard(async () => {
                          await ticketsApi.changeStatus(ticket.id, ticket.etag, status);
                        })
                      }
                    >
                      {status.replace(/([A-Z])/g, " $1").trim()}
                    </Button>
                  ))}
                  {ticket.status !== "Closed" && isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() =>
                        guard(async () => {
                          await ticketsApi.changeStatus(ticket.id, ticket.etag, "Closed", "Force closed by admin");
                        })
                      }
                    >
                      Force close
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to</Label>
              <Input
                id="assignee"
                placeholder="Agent user id (from admin > users)"
                disabled={busy}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    const value = e.currentTarget.value.trim();
                    await guard(async () => {
                      await ticketsApi.assign(ticket.id, ticket.etag, value);
                    });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Press Enter to assign. Claim your own ticket to start working (status moves to In Progress).</p>
            </div>

            {canEditMetadata && (
              <Button size="sm" variant="outline" onClick={() => setEditingMeta((v) => !v)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> {editingMeta ? "Close editor" : "Edit metadata"}
              </Button>
            )}
            {!canEditMetadata && ticket.status !== "Closed" && (
              <p className="text-xs text-muted-foreground">Metadata is locked once the ticket leaves Open/In Progress.</p>
            )}
            {isAdmin && ticket.status !== "Closed" && (
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  guard(async () => {
                    await ticketsApi.softDelete(ticket.id);
                    window.location.href = "/tickets";
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Soft delete ticket
              </Button>
            )}
          </Card>
        )}

        {canEditMetadata && editingMeta && (
          <MetadataEditForm
            key={`${ticket.id}-${ticket.etag}`}
            ticket={ticket}
            onCancel={() => setEditingMeta(false)}
            onSave={async (data) => {
              await guard(async () => {
                await ticketsApi.update(ticket.id, ticket.etag, data);
                setEditingMeta(false);
              });
            }}
          />
        )}

        {(attachments?.length ?? 0) > 0 && (
          <Card>
            <CardTitle className="text-base">Files</CardTitle>
            <ul className="mt-3 space-y-2">
              {(attachments ?? []).map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    className="flex min-w-0 cursor-pointer items-center gap-2 text-left text-primary hover:underline"
                    onClick={() => guard(() => downloadAttachment(ticket.id, file.id, file.fileName))}
                  >
                    <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{file.fileName}</span>
                  </button>
                  {user?.id === file.uploadedById && ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                    <button
                      type="button"
                      aria-label={`Delete ${file.fileName}`}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        guard(async () => {
                          await ticketsApi.deleteAttachment(ticket.id, file.id);
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {actionError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
      </div>
    </div>
  );
}

// ---------- inline metadata editor (US-2.05: Open/In Progress only) ----------

interface MetadataEditData {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: string;
}

function MetadataEditForm({
  ticket,
  onSave,
  onCancel,
}: {
  ticket: TicketDetail;
  onSave: (data: MetadataEditData) => Promise<void>;
  onCancel: () => void;
}) {
  const { data: categories } = useQuery(() => catalogApi.categories(), []);
  const [form, setForm] = useState<MetadataEditData>({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    categoryId: ticket.categoryId,
  });
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-3">
      <CardTitle className="text-base">Edit metadata</CardTitle>
      <div className="space-y-1.5">
        <Label htmlFor="meta-title">Title</Label>
        <Input
          id="meta-title"
          minLength={5}
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="meta-desc">Description</Label>
        <textarea
          id="meta-desc"
          rows={4}
          maxLength={5000}
          value={form.description}
          className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="meta-priority">Priority</Label>
          <select
            id="meta-priority"
            value={form.priority}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
            onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
          >
            {(["Low", "Medium", "High", "Urgent"] as TicketPriority[]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta-category">Category</Label>
          <select
            id="meta-category"
            value={form.categoryId}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            {(categories ?? []).filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(form);
            setSaving(false);
          }}
        >
          Save changes
        </Button>
      </div>
    </Card>
  );
}

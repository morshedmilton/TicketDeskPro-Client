"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FileDropzone } from "@/components/tickets/FileDropzone";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { catalogApi } from "@/lib/admin";
import { ticketsApi } from "@/lib/tickets";
import { Button, Card, Input, Label } from "@/lib/ui-helpers";
import type { TicketPriority } from "@/types";

const PRIORITIES: { value: TicketPriority; hint: string }[] = [
  { value: "Low", hint: "Response within 8h" },
  { value: "Medium", hint: "Response within 4h" },
  { value: "High", hint: "Response within 2h" },
  { value: "Urgent", hint: "Response within 30 min" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { data: categories } = useQuery(() => catalogApi.categories(), []);

  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" as TicketPriority, categoryId: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    let ticket;
    try {
      ticket = await ticketsApi.create({ ...form, categoryId: form.categoryId || categories![0].id });
    } catch (err) {
      setError(toApiError(err).message);
      setIsSubmitting(false);
      return; // nothing was created — safe to fix the form and retry
    }

    // The ticket EXISTS from here on: never let an upload failure trap the user in
    // a form that would create a duplicate on retry (M9).
    const results = await Promise.allSettled(files.map((file) => ticketsApi.uploadAttachment(ticket.id, file)));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      window.sessionStorage.setItem("tdp-upload-warning", `${failed} file(s) could not be attached — retry from the ticket page.`);
    }
    router.push(`/tickets/${ticket.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit a Support Request</h1>
        <p className="text-sm text-muted-foreground">Describe the issue — an agent picks it up right away.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required minLength={5} maxLength={200} placeholder="Cannot login to dashboard" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <p className="text-xs text-muted-foreground">5–200 characters.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What happened?</Label>
            <textarea
              id="description"
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              placeholder="Steps to reproduce, error messages, what you expected…"
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">10–5000 characters.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.value} — {p.hint}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                required
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Choose a category…</option>
                {(categories ?? []).filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <FileDropzone files={files} onChange={setFiles} />

          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

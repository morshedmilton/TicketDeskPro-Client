"use client";

import { FormEvent, useState } from "react";
import { Loader2, Timer } from "lucide-react";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { slaApi } from "@/lib/admin";
import { Button, Card, CardDescription, CardTitle, Input, Label } from "@/lib/ui-helpers";
import type { SlaPolicy } from "@/types";

const PRIORITY_ACCENT: Record<string, string> = {
  Low: "border-l-emerald-500",
  Medium: "border-l-amber-500",
  High: "border-l-orange-500",
  Urgent: "border-l-red-500",
};

export default function SlaPoliciesPage() {
  const { data, refetch } = useQuery(() => slaApi.list(), []);
  const [editing, setEditing] = useState<SlaPolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await slaApi.update(editing.id, {
        name: String(form.get("name")),
        firstResponseMinutes: Number(form.get("firstResponseMinutes")),
        resolutionMinutes: Number(form.get("resolutionMinutes")),
        isActive: form.get("isActive") === "on",
      });
      refetch();
      setEditing(null);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  const hours = (minutes: number) => (minutes >= 60 ? `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)}h` : `${minutes}m`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SLA Policies</h1>
        <p className="text-sm text-muted-foreground">Targets per priority — new tickets snapshot these at creation (US-5.01).</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((policy) => (
          <Card key={policy.id} className={`border-l-4 ${PRIORITY_ACCENT[policy.priority] ?? "border-l-border"}`}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{policy.priority}</CardTitle>
                <CardDescription>{policy.name}{!policy.isActive && " · inactive"}</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(policy)}>Edit</Button>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> First response <b>{hours(policy.firstResponseMinutes)}</b></span>
              <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Resolution <b>{hours(policy.resolutionMinutes)}</b></span>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Card>
          <CardTitle className="text-base">Edit {editing.priority} policy</CardTitle>
          <form onSubmit={onSave} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={editing.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firstResponseMinutes">First response (minutes)</Label>
              <Input id="firstResponseMinutes" name="firstResponseMinutes" type="number" min={1} required defaultValue={editing.firstResponseMinutes} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resolutionMinutes">Resolution (minutes)</Label>
              <Input id="resolutionMinutes" name="resolutionMinutes" type="number" min={1} required defaultValue={editing.resolutionMinutes} />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={editing.isActive} className="h-4 w-4 rounded border-border accent-primary" />
              Active
            </label>
            <div className="flex justify-end gap-2 sm:col-span-3">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save policy
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

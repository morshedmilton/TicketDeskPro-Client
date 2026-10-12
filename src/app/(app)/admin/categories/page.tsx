"use client";

import { FormEvent, useState } from "react";
import { Loader2, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { catalogApi } from "@/lib/admin";
import { Button, Card, CardTitle, Input } from "@/lib/ui-helpers";

export default function CategoriesPage() {
  const { data: categories, refetch: refetchCategories } = useQuery(() => catalogApi.categories(), []);
  const { data: tags, refetch: refetchTags } = useQuery(() => catalogApi.tags(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guard(action: () => Promise<unknown>, refetch: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      refetch();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await guard(() => catalogApi.createCategory({ name: String(form.get("name")), description: String(form.get("description") || "") || null }), refetchCategories);
    event.currentTarget.reset();
  }

  async function onTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await guard(() => catalogApi.createTag({ name: String(form.get("name")) }), refetchTags);
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories & Tags</h1>
        <p className="text-sm text-muted-foreground">Labels for the create-ticket form (US-10.01). Deleting a used category is blocked — deactivate it instead.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="text-base">Categories</CardTitle>
          <ul className="mt-3 space-y-2">
            {(categories ?? []).map((category) => (
              <li key={category.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span>
                  {category.name}
                  {!category.isActive && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">inactive</span>}
                </span>
                <button type="button" aria-label={`Delete ${category.name}`} disabled={busy}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => guard(() => catalogApi.deleteCategory(category.id), refetchCategories)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={onCategory} className="mt-4 flex gap-2">
            <Input name="name" placeholder="New category" required />
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle className="text-base">Tags</CardTitle>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(tags ?? []).map((tag) => (
              <li key={tag.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {tag.name}
                <button type="button" aria-label={`Delete ${tag.name}`} disabled={busy}
                  className="ml-1 cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => guard(() => catalogApi.deleteTag(tag.id), refetchTags)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={onTag} className="mt-4 flex gap-2">
            <Input name="name" placeholder="new-tag" required />
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

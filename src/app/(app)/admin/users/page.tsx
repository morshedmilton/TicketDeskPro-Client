"use client";

import { FormEvent, useState } from "react";
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useQuery } from "@/hooks/useQuery";
import { toApiError } from "@/lib/api";
import { usersApi } from "@/lib/admin";
import { Button, Card, CardTitle, Input, Label } from "@/lib/ui-helpers";
import type { UserAdmin } from "@/types";

const ALL_ROLES = ["Customer", "Agent", "Admin", "SuperAdmin"];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserAdmin | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, refetch } = useQuery(() => usersApi.list({ search, limit: 50 }), [search]);

  async function guard(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      refetch();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
      setEditing(null);
      setCreating(false);
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roles = ALL_ROLES.filter((role) => form.get(`role-${role}`));
    await guard(() =>
      usersApi.create({
        email: String(form.get("email")),
        password: String(form.get("password")),
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        phone: String(form.get("phone") || "") || null,
        roles,
      }),
    );
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const roles = ALL_ROLES.filter((role) => form.get(`role-${role}`));
    await guard(() =>
      usersApi.update(editing.id, {
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        phone: String(form.get("phone") || "") || null,
        isActive: form.get("isActive") === "on",
        roles,
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Accounts, roles and access (US-1.08). SuperAdmins cannot be deleted (BR-038).</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Invite user
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-search">Search users</Label>
        <Input id="user-search" placeholder="Name, email or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Roles</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((user) => (
              <tr key={user.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-xs">{user.roles.join(", ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(user)}>Edit</Button>
                    {user.deletedAt ? (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => guard(() => usersApi.restore(user.id))}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restore
                      </Button>
                    ) : user.isActive ? (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => guard(() => usersApi.update(user.id, { firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: false, roles: null }))}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => guard(() => usersApi.update(user.id, { firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: true, roles: null }))}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reactivate
                      </Button>
                    )}
                    {!user.deletedAt && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => guard(() => usersApi.remove(user.id))}>
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(creating || editing) && (
        <Card>
          <CardTitle className="text-base">{creating ? "Invite user" : `Edit ${editing!.firstName}`}</CardTitle>
          <form onSubmit={creating ? onCreate : onUpdate} className="mt-4 grid gap-4 sm:grid-cols-2">
            {creating && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Temporary password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required defaultValue={editing?.firstName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required defaultValue={editing?.lastName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
            <div className="space-y-3 sm:col-span-2">
              <Label>Roles</Label>
              <RoleBoxes selected={editing?.roles ?? ["Customer"]} />
            </div>
            {editing && (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="isActive" defaultChecked={editing.isActive} className="h-4 w-4 rounded border-border accent-primary" />
                Account active
              </label>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {creating ? "Create user" : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function RoleBoxes({ selected }: { selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {ALL_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name={`role-${role}`} defaultChecked={selected.includes(role)} className="h-4 w-4 rounded border-border accent-primary" />
          {role}
        </label>
      ))}
    </div>
  );
}

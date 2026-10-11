"use client";

import { Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardDescription, CardTitle } from "@/lib/ui-helpers";

/** Phase 6 placeholder — Phase 7 wires the real KPI cards and charts. */
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what is happening on the support desk today.
        </p>
      </div>

      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Ticket className="h-6 w-6" aria-hidden="true" />
        </span>
        <CardTitle>Dashboard widgets are coming in Phase 7</CardTitle>
        <CardDescription className="max-w-md">
          KPI cards, ticket trends, category charts and the agent leaderboard will
          land here — wired to <code className="rounded bg-muted px-1">/dashboard/*</code> endpoints.
        </CardDescription>
      </Card>
    </div>
  );
}

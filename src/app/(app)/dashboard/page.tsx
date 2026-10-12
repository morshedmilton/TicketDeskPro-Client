"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Ticket } from "lucide-react";
import {
  AgentLeaderboard,
  CategoryPieChart,
  PriorityBarChart,
  TrendLineChart,
} from "@/components/charts/DashboardCharts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { dashboardApi } from "@/lib/admin";
import { ticketsApi } from "@/lib/tickets";
import { Button, Card, CardDescription, CardTitle } from "@/lib/ui-helpers";

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={accent ? "border-accent/40" : undefined}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAgentLike = useMemo(
    () => (user?.roles ?? []).some((r) => r === "Agent" || r === "Admin" || r === "SuperAdmin"),
    [user?.roles],
  );
  const [version, setVersion] = useState(0);

  // Real-time: numbers refresh when anything changes anywhere (US-8.01).
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    window.addEventListener("tdp-toast", listener);
    return () => window.removeEventListener("tdp-toast", listener);
  }, []);

  // Customers lack dashboard.view — never fire admin endpoints on their behalf (H1).
  const { data: kpis } = useQuery(() => (isAgentLike ? dashboardApi.kpis() : Promise.resolve(null)), [isAgentLike, version]);
  const { data: trends } = useQuery(() => (isAgentLike ? dashboardApi.trends(30) : Promise.resolve(null)), [isAgentLike, version]);
  const { data: categoryPoints } = useQuery(() => (isAgentLike ? dashboardApi.categories() : Promise.resolve(null)), [isAgentLike, version]);
  const { data: agentPerf } = useQuery(() => (isAgentLike ? dashboardApi.agents() : Promise.resolve([])), [isAgentLike, version]);
  // "My" numbers are always scoped to the signed-in user (assigned tickets; own tickets for customers).
  const { data: myTickets } = useQuery(
    () => ticketsApi.list({ limit: 100, assignedTo: isAgentLike ? user?.id : undefined }),
    [isAgentLike, user?.id, version],
  );

  const myOpen = (myTickets?.items ?? []).filter(
    (t) => !["Resolved", "Closed"].includes(t.status),
  ).length;


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName ?? "there"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAgentLike ? "The desk at a glance — numbers refresh 30s after changes." : "Your requests at a glance."}
          </p>
        </div>
        <Button onClick={() => router.push("/tickets/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Ticket
        </Button>
      </div>

      {/* personal strip — every role sees their own open count */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My open tickets" value={myOpen} accent />
        {isAgentLike && kpis && (
          <>
            <StatCard label="Open across the desk" value={kpis.openByPriority.total} />
            <StatCard label="SLA compliance (7d)" value={`${kpis.slaComplianceRate7Days}%`} />
          </>
        )}
        {!isAgentLike && (
          <>
            <StatCard label="Resolved by me" value={(myTickets?.items ?? []).filter((t) => t.status === "Resolved" || t.status === "Closed").length} />
            <StatCard label="Awaiting replies" value={(myTickets?.items ?? []).filter((t) => t.status === "AwaitingCustomer").length} />
          </>
        )}
      </div>

      {isAgentLike ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle className="text-base">Open tickets by priority</CardTitle>
              <CardDescription>Current backlog, live</CardDescription>
              {kpis ? <PriorityBarChart data={kpis.openByPriority} /> : <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
            </Card>
            <Card>
              <CardTitle className="text-base">Created vs resolved</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
              {trends ? <TrendLineChart data={trends} /> : <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
            </Card>
            <Card>
              <CardTitle className="text-base">Where tickets come from</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
              {categoryPoints ? <CategoryPieChart data={categoryPoints} /> : <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
            </Card>
            {isAgentLike && (
              <Card>
                <CardTitle className="text-base">Agent leaderboard</CardTitle>
                <CardDescription>Resolved count, last 30 days</CardDescription>
                <AgentLeaderboard data={agentPerf ?? []} />
              </Card>
            )}
          </div>
          <Link href="/tickets/queue" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open the agent queue <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Ticket className="h-6 w-6" aria-hidden="true" />
          </span>
          <CardTitle>Need a hand?</CardTitle>
          <CardDescription>Submit a request and an agent will pick it up — you&apos;ll get email updates at every step.</CardDescription>
          <Button onClick={() => router.push("/tickets/new")}>Submit a request</Button>
        </Card>
      )}
    </div>
  );
}

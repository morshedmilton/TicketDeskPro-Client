"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AgentPerformance, CategoryPoint, TicketTrendPoint } from "@/types";

/** Palette follows the design system + SLA ramp so charts never invent new colors. */
const CATEGORY_COLORS = ["#2563EB", "#8B5CF6", "#F59E0B", "#10B981", "#EA580C", "#64748B", "#EC4899", "#14B8A6"];
const PRIORITY_COLORS = { Low: "#10B981", Medium: "#F59E0B", High: "#F97316", Urgent: "#DC2626" } as const;

const axisProps = {
  stroke: "#94A3B8",
  fontSize: 11,
  tickLine: false,
} as const;

export function PriorityBarChart({ data }: { data: { low: number; medium: number; high: number; urgent: number } }) {
  const rows = [
    { name: "Low", count: data.low },
    { name: "Medium", count: data.medium },
    { name: "High", count: data.high },
    { name: "Urgent", count: data.urgent },
  ];
  return (
    <div aria-label="Open tickets by priority" className="h-56" role="img">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip cursor={{ fill: "#F1F5F9" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.name} fill={PRIORITY_COLORS[row.name as keyof typeof PRIORITY_COLORS]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLineChart({ data }: { data: TicketTrendPoint[] }) {
  const rows = data.map((point) => ({
    ...point,
    day: new Date(point.day).toLocaleDateString([], { month: "short", day: "numeric" }),
  }));
  return (
    <div aria-label="Tickets created versus resolved per day" className="h-56" role="img">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="created" name="Created" stroke="#2563EB" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: CategoryPoint[] }) {
  const rows = data.slice(0, 8);
  return (
    <div aria-label="Tickets by category" className="h-56" role="img">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="count" nameKey="categoryName" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {rows.map((_, index) => (
              <Cell key={rows[index].categoryName} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgentLeaderboard({ data }: { data: AgentPerformance[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No agent activity in the last 30 days.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Agent</th>
            <th className="px-3 py-2 font-semibold">Open</th>
            <th className="px-3 py-2 font-semibold">Resolved (30d)</th>
            <th className="px-3 py-2 font-semibold">Avg resolution</th>
          </tr>
        </thead>
        <tbody>
          {data.map((agent) => (
            <tr key={agent.userId} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 font-medium">{agent.agentName}</td>
              <td className="px-3 py-2">{agent.openAssigned}</td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{agent.resolvedLast30Days}</span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {agent.avgResolutionMinutes > 0 ? `${Math.round(agent.avgResolutionMinutes)} min` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

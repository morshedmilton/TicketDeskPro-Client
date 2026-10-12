import { request } from "@/lib/api";
import { toQuery } from "@/lib/tickets";
import type {
  AgentPerformance,
  AuditLogRow,
  Category,
  CategoryPoint,
  DashboardKpis,
  Paged,
  PermissionCatalog,
  RoleAdmin,
  SlaPolicy,
  Tag,
  TicketPriority,
  TicketTrendPoint,
  UserAdmin,
} from "@/types";

export const dashboardApi = {
  kpis: () => request<DashboardKpis>({ method: "GET", url: "/dashboard/kpis" }),
  trends: (days = 30) => request<TicketTrendPoint[]>({ method: "GET", url: `/dashboard/ticket-trends?${toQuery({ days })}` }),
  categories: () => request<CategoryPoint[]>({ method: "GET", url: "/dashboard/category-distribution" }),
  agents: () => request<AgentPerformance[]>({ method: "GET", url: "/dashboard/agent-performance" }),
};

export const usersApi = {
  list: (params: { search?: string; role?: string; limit?: number; cursor?: string } = {}) =>
    request<Paged<UserAdmin>>({ method: "GET", url: `/users?${toQuery(params)}` }),
  create: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string | null; roles: string[] }) =>
    request<UserAdmin>({ method: "POST", url: "/users", data }),
  update: (id: string, data: { firstName: string; lastName: string; phone?: string | null; isActive: boolean; roles?: string[] | null }) =>
    request<UserAdmin>({ method: "PATCH", url: `/users/${id}`, data }),
  remove: (id: string) => request<unknown>({ method: "DELETE", url: `/users/${id}` }),
  restore: (id: string) => request<UserAdmin>({ method: "POST", url: `/users/${id}/restore` }),
};

export const rolesApi = {
  list: () => request<RoleAdmin[]>({ method: "GET", url: "/admin/roles" }),
  permissions: () => request<PermissionCatalog[]>({ method: "GET", url: "/admin/roles/permissions" }),
  create: (data: { name: string; description?: string | null; permissionIds: string[] }) =>
    request<RoleAdmin>({ method: "POST", url: "/admin/roles", data }),
  update: (id: string, data: { name: string; description?: string | null; permissionIds: string[] }) =>
    request<RoleAdmin>({ method: "PUT", url: `/admin/roles/${id}`, data }),
  remove: (id: string) => request<unknown>({ method: "DELETE", url: `/admin/roles/${id}` }),
};

export const slaApi = {
  list: () => request<SlaPolicy[]>({ method: "GET", url: "/admin/sla-policies" }),
  update: (id: string, data: { name: string; firstResponseMinutes: number; resolutionMinutes: number; isActive: boolean }) =>
    request<SlaPolicy>({ method: "PUT", url: `/admin/sla-policies/${id}`, data }),
};

export const catalogApi = {
  categories: () => request<Category[]>({ method: "GET", url: "/categories" }),
  createCategory: (data: { name: string; description?: string | null }) =>
    request<Category>({ method: "POST", url: "/categories", data }),
  updateCategory: (id: string, data: { name: string; description?: string | null; isActive: boolean }) =>
    request<Category>({ method: "PUT", url: `/categories/${id}`, data }),
  deleteCategory: (id: string) => request<unknown>({ method: "DELETE", url: `/categories/${id}` }),
  tags: () => request<Tag[]>({ method: "GET", url: "/tags" }),
  createTag: (data: { name: string }) => request<Tag>({ method: "POST", url: "/tags", data }),
  deleteTag: (id: string) => request<unknown>({ method: "DELETE", url: `/tags/${id}` }),
};

export const auditApi = {
  list: (params: { userId?: string; entityType?: string; action?: string; from?: string; to?: string; limit?: number; cursor?: string } = {}) =>
    request<Paged<AuditLogRow>>({ method: "GET", url: `/audit-logs?${toQuery(params)}` }),
};

export const notificationsApi = {
  getPreferences: () =>
    request<{ emailOnTicketCreated: boolean; emailOnTicketAssigned: boolean; emailOnStatusChanged: boolean; emailOnSlaWarning: boolean; inAppEnabled: boolean }>({
      method: "GET",
      url: "/notifications/preferences",
    }),
};

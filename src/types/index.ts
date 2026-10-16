// Standard backend response envelope (FRD §6) — every API answer parses through these.
export interface ApiError {
  code: string;
  message: string;
  field?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors?: ApiError[] | null;
  traceId?: string | null;
  meta?: unknown;
}

// ---- auth (mirrors TicketDeskPro-API Application/DTOs/Auth) ----

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface AuthResponse {
  // No refreshToken: it travels only as an HttpOnly Set-Cookie (XSS hardening).
  accessToken: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

// ---- tickets (Phase 7 will extend) ----

export type TicketStatus =
  | "Open"
  | "InProgress"
  | "AwaitingCustomer"
  | "CustomerReplied"
  | "Resolved"
  | "Closed"
  | "Reopened";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  categoryName: string;
  createdById: string;
  createdByName: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: number;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Role helpers — claims ride the JWT as repeated "role" values. */
export const Roles = {
  Customer: "Customer",
  Agent: "Agent",
  Admin: "Admin",
  SuperAdmin: "SuperAdmin",
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];

// ---------- Phase 7: tickets, dashboard, admin ----------

export interface SlaSummary {
  firstResponseDeadline: string;
  resolutionDeadline: string;
  isPaused: boolean;
  isFirstResponseBreached: boolean;
  isResolutionBreached: boolean;
  firstResponseAt?: string | null;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  tags: string[];
  sla?: SlaSummary | null;
  etag: string;
}

export interface TicketListResponse {
  items: TicketSummary[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface MessageListResponse {
  items: TicketMessage[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

// ---------- dashboard ----------

export interface DashboardKpis {
  openByPriority: { low: number; medium: number; high: number; urgent: number; total: number };
  resolvedLast7Days: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  slaComplianceRate7Days: number;
  generatedAt: string;
}

export interface TicketTrendPoint {
  day: string;
  created: number;
  resolved: number;
}

export interface CategoryPoint {
  categoryName: string;
  count: number;
}

export interface AgentPerformance {
  userId: string;
  agentName: string;
  openAssigned: number;
  resolvedLast30Days: number;
  avgResolutionMinutes: number;
}

// ---------- admin ----------

export interface UserAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  deletedAt?: string | null;
}

export interface RoleAdmin {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionCatalog {
  id: string;
  name: string;
  module: string;
}

export interface SlaPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
}

export interface AuditLogRow {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: string | null;
  afterJson?: string | null;
  timestamp: string;
}

export interface Paged<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}

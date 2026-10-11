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
  accessToken: string;
  refreshToken: string;
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

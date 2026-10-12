import { api, request } from "@/lib/api";
import type {
  MessageListResponse,
  TicketDetail,
  TicketListResponse,
  TicketMessage,
  TicketAttachment,
  TicketPriority,
  TicketStatus,
} from "@/types";

export interface TicketListParams {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assignedTo?: string;
  sort?: string;
  order?: "asc" | "desc";
}

/** Query params are omitted when undefined so the backend defaults apply. */
export function toQuery(params: object): string {
  const record = params as Record<string, unknown>;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export const ticketsApi = {
  list: (params: TicketListParams) =>
    request<TicketListResponse>({ method: "GET", url: `/tickets?${toQuery(params)}` }),

  get: (id: string) => request<TicketDetail>({ method: "GET", url: `/tickets/${id}` }),

  create: (data: { title: string; description: string; priority: TicketPriority; categoryId: string; tagIds?: string[] }) =>
    request<TicketDetail>({ method: "POST", url: "/tickets", data }),

  update: (id: string, etag: string, data: { title: string; description: string; priority: TicketPriority; categoryId: string }) =>
    request<TicketDetail>({ method: "PATCH", url: `/tickets/${id}`, data, headers: { "If-Match": `"${etag}"` } }),

  changeStatus: (id: string, etag: string, status: TicketStatus, reason?: string) =>
    request<TicketDetail>({ method: "PATCH", url: `/tickets/${id}/status`, data: { status, reason }, headers: { "If-Match": `"${etag}"` } }),

  assign: (id: string, etag: string, assignedToId: string) =>
    request<TicketDetail>({ method: "POST", url: `/tickets/${id}/assign`, data: { assignedToId }, headers: { "If-Match": `"${etag}"` } }),

  softDelete: (id: string) => request<unknown>({ method: "DELETE", url: `/tickets/${id}` }),

  restore: (id: string) => request<unknown>({ method: "POST", url: `/tickets/${id}/restore` }),

  messages: (ticketId: string, params: { limit?: number; cursor?: string } = {}) =>
    request<MessageListResponse>({ method: "GET", url: `/tickets/${ticketId}/messages?${toQuery(params)}` }),

  addMessage: (ticketId: string, content: string, isInternal: boolean) =>
    request<TicketMessage>({ method: "POST", url: `/tickets/${ticketId}/messages`, data: { content, isInternal } }),

  attachments: (ticketId: string) =>
    request<TicketAttachment[]>({ method: "GET", url: `/tickets/${ticketId}/attachments` }),

  uploadAttachment: (ticketId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    // Let the browser set the multipart boundary — never force Content-Type here.
    return request<TicketAttachment>({ method: "POST", url: `/tickets/${ticketId}/attachments`, data: form });
  },

  deleteAttachment: (ticketId: string, attachmentId: string) =>
    request<unknown>({ method: "DELETE", url: `/tickets/${ticketId}/attachments/${attachmentId}` }),
};

/** Browser-side download through the axios instance so a 401 triggers the same
 *  single-flight refresh as every other call (M13). Uses `api` directly — the
 *  envelope helper expects JSON, downloads are raw bytes. */
export async function downloadAttachment(ticketId: string, attachmentId: string, fileName: string): Promise<void> {
  const response = await api.get<Blob>(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

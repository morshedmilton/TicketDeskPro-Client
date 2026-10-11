import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-style class combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Decodes a JWT payload without verification (display-only — the server is the
 * only trust anchor; middleware uses this to gate routes before hydration).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function rolesFromToken(token: string): string[] {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (Array.isArray(role)) return role as string[];
  if (typeof role === "string") return [role];
  return [];
}

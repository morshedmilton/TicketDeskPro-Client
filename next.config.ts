import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Auth endpoints proxy through the Next server so the HttpOnly refresh
    // cookie is FIRST-party — Safari drops third-party cookies entirely, and
    // Vercel↔Render are different sites. Everything else (tickets, dashboard,
    // SignalR) still calls the API origin directly with the Bearer token.
    const api = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/+$/, "");
    return [{ source: "/api/v1/auth/:path*", destination: `${api}/auth/:path*` }];
  },
};

export default nextConfig;

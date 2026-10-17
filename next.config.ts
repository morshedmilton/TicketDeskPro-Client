import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Baseline security headers on every page (FE-H1). No CSP yet — Next.js
    // inline bootstrap scripts make a strict CSP a separate project.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
    ];
  },
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

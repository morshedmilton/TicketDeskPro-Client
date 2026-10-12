"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toApiError } from "@/lib/api";
import { Button, Card, CardDescription, CardTitle, Input, Label } from "@/lib/ui-helpers";

/** PRD wireframe: centered card, logo handled by the auth layout,
 *  email + password, forgot-password link, primary "Sign In", register link.
 *  Demo buttons per role — always in dev, and in prod only when the host opts in
 *  with NEXT_PUBLIC_SHOW_DEMO_LOGIN=true (mirrors the API's SeedDemoUsers flag). */
const DEMO_ACCOUNTS =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true"
    ? ([
        { role: "Customer", email: "customer@ticketdesk.dev" },
        { role: "Agent", email: "agent@ticketdesk.dev" },
        { role: "Admin", email: "admin@ticketdesk.dev" },
        { role: "SuperAdmin", email: "superadmin@ticketdesk.dev" },
      ] as const)
    : [];

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Only same-origin paths — never //evil.com or absolute URLs.
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  async function submit(targetEmail = email, targetPassword = password) {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(targetEmail, targetPassword);
      router.replace(nextPath);
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.code === "AUTH_001" ? "Invalid email or password." : apiError.message);
      setIsSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function onDemoLogin(demoEmail: string) {
    // Demo accounts all share the seeded dev password.
    setEmail(demoEmail);
    void submit(demoEmail, "Admin123!");
  }

  return (
    <Card className="shadow-lg">
      <CardTitle>Sign in</CardTitle>
      <CardDescription>Use your work email to access the support desk.</CardDescription>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Sign In
        </Button>
      </form>

      {DEMO_ACCOUNTS.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-3 text-center text-xs text-muted-foreground">Demo login (seeded accounts)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.role}
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => onDemoLogin(account.email)}
              >
                {account.role}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}

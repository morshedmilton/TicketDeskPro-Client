"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { request, toApiError } from "@/lib/api";
import { Button, Card, CardDescription, CardTitle, Input, Label } from "@/lib/ui-helpers";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await request({
        method: "POST",
        url: "/auth/reset-password",
        data: { token, newPassword: password },
      });
      setDone(true);
    } catch (err) {
      // Expired/used token surfaces here as a clean API error.
      setError(toApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <>
        <CardTitle>Invalid reset link</CardTitle>
        <CardDescription>This link is missing its token. Request a new one below.</CardDescription>
        <div className="mt-6">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <CardTitle>Choose a new password</CardTitle>
      <CardDescription>The link is valid for 1 hour and can be used once.</CardDescription>

      {done ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">Password updated. You can sign in now.</p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must contain an uppercase letter, a number and a special character.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Update password
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <Card className="shadow-lg">
        <ResetPasswordForm />
      </Card>
    </Suspense>
  );
}

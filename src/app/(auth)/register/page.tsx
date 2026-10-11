"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toApiError } from "@/lib/api";
import { Button, Card, CardDescription, CardTitle, Input, Label } from "@/lib/ui-helpers";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
      });
    } catch (err) {
      const apiError = toApiError(err);
      setError(
        apiError.code === "CPL_001"
          ? "An account with this email already exists."
          : apiError.message,
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Registration succeeded — log the new customer straight in.
      await login(form.email, form.password);
      router.replace("/dashboard");
    } catch {
      setError("Account created, but automatic sign-in failed — please sign in manually.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardTitle>Create your account</CardTitle>
      <CardDescription>Customers register here — agents are invited by an admin.</CardDescription>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" required placeholder="you@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" value={form.password} onChange={(e) => update("password", e.target.value)} />
          <p className="text-xs text-muted-foreground">Must contain an uppercase letter, a number and a special character.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

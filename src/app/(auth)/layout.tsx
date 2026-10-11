import { LifeBuoy } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <LifeBuoy className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold">TicketDesk Pro</h1>
          <p className="text-sm text-muted-foreground">Enterprise support, organized.</p>
        </div>
        {children}
      </div>
    </main>
  );
}

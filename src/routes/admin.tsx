import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { AdminShell } from "@/components/admin/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminUser, useSession } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Studio panel — Radic Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const session = useSession();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    isAdminUser().then(setAdmin);
  }, [session]);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-graphite">
        Loading…
      </div>
    );
  }
  if (!session) return <Login />;
  if (admin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-graphite">
        Checking access…
      </div>
    );
  }
  if (!admin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-ink">
          This account ({session.user.email}) isn't on the studio's admin list.
        </p>
        <Button variant="outline" onClick={() => getSupabase().auth.signOut()}>
          Sign out
        </Button>
      </div>
    );
  }
  return (
    <AdminShell email={session.user.email ?? ""}>
      <Outlet />
    </AdminShell>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <img src="/brand/logo-primary.png" alt="Radic Studio" className="mx-auto h-14 w-auto" />
        <h1 className="font-display mt-8 text-center text-2xl font-semibold text-ink">
          Studio panel
        </h1>
        <p className="mt-1 text-center text-sm text-graphite">Sign in to edit the website.</p>
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-2xl border border-mist bg-white p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <a href="/" className="mt-6 block text-center text-sm text-graphite hover:text-ink">
          ← Back to the site
        </a>
      </div>
    </div>
  );
}

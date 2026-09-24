import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Nimbus Stock Control" },
      {
        name: "description",
        content: "Sign in to Nimbus to track stock levels, movements, returns and low-stock alerts.",
      },
      { property: "og:title", content: "Sign in · Nimbus Stock Control" },
      {
        property: "og:description",
        content: "Sign in to Nimbus to track stock levels, movements, returns and low-stock alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-b from-sky/10 via-panel/40 to-rose/10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-ink grid place-items-center">
            <span className="text-paper font-semibold text-[13px] font-display">N</span>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold font-display">Nimbus</div>
            <div className="text-[11px] text-ink/55">Stock Control</div>
          </div>
        </Link>
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl font-semibold text-balance">
            Every unit in, out and returned — counted.
          </h2>
          <p className="mt-3 text-sm text-ink/60 text-pretty">
            Track quantities, log movements and get warned before a line runs dry.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink/50">
          <span className="size-2 rounded-full bg-mint shrink-0" />
          Low-stock alerts armed · Bays A1–A4 ready
        </div>
      </div>

      <div className="w-full lg:w-[440px] shrink-0 border-l border-ink/10 flex items-center px-6 lg:px-10 py-10">
        <div className="w-full rounded-2xl glass ring-1 ring-ink/5 p-6 shadow-sm">
          <div className="mb-6">
            <div className="text-[13px] font-semibold font-display">Nimbus</div>
            <div className="text-[11px] text-ink/55">
              {mode === "signin" ? "Sign in to continue" : "Create your inventory"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
                Operator email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
                placeholder="••••••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm rounded-lg px-3 py-2 bg-ink text-paper ring-1 ring-ink disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full text-sm rounded-lg px-3 py-2 bg-panel/70 ring-1 ring-ink/10 hover:bg-panel transition-colors"
          >
            Continue with Google
          </button>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-[11px] text-ink/55 hover:text-ink"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <LayoutGrid className="h-6 w-6 text-gold" strokeWidth={2.5} />
          ProjectNext
        </div>
        <div>
          <p className="font-display text-4xl font-semibold leading-tight">
            Plan the work.
            <br />
            Move it forward.
            <br />
            <span className="text-gold">Together.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm text-paper/60">
            Boards, tasks, and conversation in one place — with updates that land the moment
            they happen.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "To Do", color: "bg-ink-soft" },
            { label: "In Progress", color: "bg-gold" },
            { label: "Done", color: "bg-sage" },
          ].map((c) => (
            <div key={c.label} className="w-28 rounded-lg border border-white/10 bg-white/5 p-3 shadow-stacked">
              <div className={`mb-2 h-1.5 w-8 rounded-full ${c.color}`} />
              <div className="h-2 w-full rounded bg-white/15" />
              <div className="mt-1.5 h-2 w-2/3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <LayoutGrid className="h-6 w-6 text-teal" strokeWidth={2.5} />
              ProjectNext
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to get back to your boards.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-coral-light px-3.5 py-2.5 text-sm text-coral">
                {error}
              </div>
            )}
            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New to ProjectNext?{" "}
            <Link to="/register" className="font-semibold text-teal hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.userMessage || "Couldn't create your account. Try again.");
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
            Every project.
            <br />
            One shared board.
            <br />
            <span className="text-gold">No lost updates.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm text-paper/60">
            Create a project, invite your team, and watch tasks move in real time as everyone
            works.
          </p>
        </div>
        <div className="text-xs text-paper/40">Free to use — set up in under a minute.</div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <LayoutGrid className="h-6 w-6 text-teal" strokeWidth={2.5} />
              ProjectNext
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink-soft">Start organizing work with your team.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-coral-light px-3.5 py-2.5 text-sm text-coral">
                {error}
              </div>
            )}
            <div>
              <label className="label-text">Full name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Jordan Lee"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

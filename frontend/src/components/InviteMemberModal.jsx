import { useState } from "react";
import { X } from "lucide-react";

export default function InviteMemberModal({ onClose, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onInvite({ email, role });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add that member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Invite a member</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-soft hover:bg-ink/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-coral-light px-3.5 py-2.5 text-sm text-coral">{error}</div>
          )}
          <div>
            <label className="label-text">Email address</label>
            <input
              autoFocus
              type="email"
              className="input-field"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              They need a ProjectNext account with this email already.
            </p>
          </div>
          <div>
            <label className="label-text">Role</label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Adding…" : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

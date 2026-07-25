import { useState } from "react";
import { X } from "lucide-react";

export default function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Give the project a name.");
    setLoading(true);
    try {
      await onCreate({ name, description });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">New project</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-soft hover:bg-ink/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-coral-light px-3.5 py-2.5 text-sm text-coral">{error}</div>
          )}
          <div>
            <label className="label-text">Project name</label>
            <input
              autoFocus
              className="input-field"
              placeholder="Website redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">Description (optional)</label>
            <textarea
              className="input-field min-h-[90px] resize-none"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

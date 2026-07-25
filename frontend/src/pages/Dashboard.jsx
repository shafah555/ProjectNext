import { useEffect, useState } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const { data } = await api.get("/api/projects");
    setProjects(data.projects);
    setLoading(false);
  }

  async function handleCreate(payload) {
    const { data } = await api.post("/api/projects", payload);
    setProjects((prev) => [data.project, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Hey {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-ink-soft">Here are the projects you're part of.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-ink/5" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 py-20 text-center">
            <LayoutGrid className="mb-3 h-10 w-10 text-ink/20" />
            <h3 className="font-display text-lg font-semibold text-ink">No projects yet</h3>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              Create your first project and invite teammates to start assigning tasks together.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
              <Plus className="h-4 w-4" /> Create a project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { Users, CheckCircle2 } from "lucide-react";

export default function ProjectCard({ project }) {
  const progress =
    project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-display text-base font-semibold text-ink group-hover:text-teal">
          {project.name}
        </h3>
        {project.role === "owner" && (
          <span className="rounded-full bg-gold-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
            Owner
          </span>
        )}
      </div>
      <p className="mb-4 line-clamp-2 flex-1 text-sm text-ink-soft">
        {project.description || "No description yet."}
      </p>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-ink-soft">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {project.member_count} member
          {project.member_count === "1" ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> {project.task_count} tasks
        </span>
      </div>
    </Link>
  );
}

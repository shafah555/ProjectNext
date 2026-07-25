import { MessageSquare, Calendar } from "lucide-react";
import { format, isPast } from "date-fns";
import MemberBadge from "./MemberBadge";

const PRIORITY_COLOR = {
  low: "bg-teal",
  medium: "bg-gold",
  high: "bg-coral",
  urgent: "bg-coral",
};

export default function TaskCard({ task, onClick, onDragStart }) {
  const overdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date));

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg border border-ink/10 bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop active:cursor-grabbing"
    >
      {/* Signature element: folded priority tab in the top-right corner */}
      <span
        className={`absolute right-0 top-0 h-4 w-4 rounded-bl-lg rounded-tr-lg ${PRIORITY_COLOR[task.priority] || "bg-ink-soft"}`}
        title={`${task.priority} priority`}
      />

      <p className="pr-4 text-sm font-medium leading-snug text-ink">{task.title}</p>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                overdue ? "bg-coral-light text-coral" : "bg-ink/5 text-ink-soft"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), "MMM d")}
            </span>
          )}
          {task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-ink-soft">
              <MessageSquare className="h-3 w-3" /> {task.comment_count}
            </span>
          )}
        </div>
        {task.assignee_id && (
          <MemberBadge member={{ name: task.assignee_name, avatar_color: task.assignee_color }} />
        )}
      </div>
    </div>
  );
}

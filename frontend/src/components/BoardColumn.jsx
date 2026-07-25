import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const COLUMN_STYLES = {
  todo: { dot: "bg-ink-soft", label: "To Do" },
  in_progress: { dot: "bg-gold", label: "In Progress" },
  in_review: { dot: "bg-teal", label: "In Review" },
  done: { dot: "bg-sage", label: "Done" },
};

export default function BoardColumn({
  status,
  tasks,
  onTaskClick,
  onDragStart,
  onDrop,
  onAddTask,
  dragOverColumn,
  setDragOverColumn,
}) {
  const meta = COLUMN_STYLES[status];
  const isOver = dragOverColumn === status;

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-ink/5 p-3 transition ${
        isOver ? "ring-2 ring-teal ring-offset-2 ring-offset-paper" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverColumn(status);
      }}
      onDragLeave={() => setDragOverColumn(null)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(status);
        setDragOverColumn(null);
      }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <h3 className="text-sm font-semibold text-ink">{meta.label}</h3>
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="rounded-md p-1 text-ink-soft transition hover:bg-white hover:text-ink"
          title="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-[4rem] flex-col gap-2.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDragStart={onDragStart}
          />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink/15 py-6 text-center text-xs text-ink-soft/60">
            Drop a task here
          </div>
        )}
      </div>
    </div>
  );
}

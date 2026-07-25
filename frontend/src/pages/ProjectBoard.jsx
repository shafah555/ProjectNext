import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, Settings } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import BoardColumn from "../components/BoardColumn";
import TaskModal from "../components/TaskModal";
import InviteMemberModal from "../components/InviteMemberModal";
import MemberBadge from "../components/MemberBadge";
import { useSocket } from "../context/SocketContext";

const STATUSES = ["todo", "in_progress", "in_review", "done"];

export default function ProjectBoard() {
  const { id: projectId } = useParams();
  const { socket } = useSocket();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const loadProject = useCallback(async () => {
    const { data } = await api.get(`/api/projects/${projectId}`);
    setProject(data.project);
    setMembers(data.members);
    setTasks(data.tasks);
    setRole(data.role);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Join the project's socket room and react to live task/comment events
  useEffect(() => {
    if (!socket) return;
    socket.emit("project:join", projectId);

    function onCreated(task) {
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]));
    }
    function onUpdated(task) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)));
      setActiveTask((prev) => (prev && prev.id === task.id ? { ...prev, ...task } : prev));
    }
    function onDeleted({ id }) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setActiveTask((prev) => (prev && prev.id === id ? null : prev));
    }

    socket.on("task:created", onCreated);
    socket.on("task:updated", onUpdated);
    socket.on("task:deleted", onDeleted);

    return () => {
      socket.emit("project:leave", projectId);
      socket.off("task:created", onCreated);
      socket.off("task:updated", onUpdated);
      socket.off("task:deleted", onDeleted);
    };
  }, [socket, projectId]);

  async function handleAddTask(status) {
    const title = window.prompt("Task title");
    if (!title || !title.trim()) return;
    const { data } = await api.post(`/api/projects/${projectId}/tasks`, { title: title.trim(), status });
    setTasks((prev) => [...prev, data.task]);
  }

  async function handleUpdateTask(taskId, patch) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    const { data } = await api.patch(`/api/projects/${projectId}/tasks/${taskId}`, patch);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    setActiveTask((prev) => (prev && prev.id === taskId ? data.task : prev));
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setActiveTask(null);
    await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
  }

  async function handleInvite({ email, role: inviteRole }) {
    const { data } = await api.post(`/api/projects/${projectId}/members`, { email, role: inviteRole });
    setMembers((prev) => [...prev, data.member]);
    setShowInvite(false);
  }

  function handleDragStart(e, task) {
    setDraggedTask(task);
  }

  function handleDrop(status) {
    if (draggedTask && draggedTask.status !== status) {
      handleUpdateTask(draggedTask.id, { status });
    }
    setDraggedTask(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{project.name}</h1>
            {project.description && <p className="mt-1 max-w-xl text-sm text-ink-soft">{project.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.map((m) => (
                <MemberBadge key={m.id} member={m} size="md" />
              ))}
            </div>
            {["owner", "admin"].includes(role) && (
              <button onClick={() => setShowInvite(true)} className="btn-secondary">
                <UserPlus className="h-4 w-4" /> Invite
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              onTaskClick={setActiveTask}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onAddTask={handleAddTask}
              dragOverColumn={dragOverColumn}
              setDragOverColumn={setDragOverColumn}
            />
          ))}
        </div>
      </main>

      {activeTask && (
        <TaskModal
          task={activeTask}
          members={members}
          projectId={projectId}
          onClose={() => setActiveTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showInvite && (
        <InviteMemberModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}
    </div>
  );
}

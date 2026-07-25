import { useEffect, useRef, useState } from "react";
import { X, Trash2, Send } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import CommentItem from "./CommentItem";
import MemberBadge from "./MemberBadge";

export default function TaskModal({ task, members, projectId, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/api/tasks/${task.id}/comments`).then(({ data }) => {
      setComments(data.comments);
      setLoadingComments(false);
    });
  }, [task.id]);

  useEffect(() => {
    function onCreated({ taskId, comment }) {
      if (taskId === task.id) setComments((prev) => [...prev, comment]);
    }
    function onDeleted({ taskId, commentId }) {
      if (taskId === task.id) setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    function onTyping({ taskId, userName }) {
      if (taskId === task.id && userName !== user.name) {
        setTypingUser(userName);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
      }
    }
    socket?.on("comment:created", onCreated);
    socket?.on("comment:deleted", onDeleted);
    socket?.on("comment:typing", onTyping);
    return () => {
      socket?.off("comment:created", onCreated);
      socket?.off("comment:deleted", onDeleted);
      socket?.off("comment:typing", onTyping);
    };
  }, [socket, task.id, user.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  function handleTitleBlur() {
    if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() });
  }

  function handleDescriptionBlur() {
    if (description !== task.description) onUpdate(task.id, { description });
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const content = newComment.trim();
    setNewComment("");
    await api.post(`/api/tasks/${task.id}/comments`, { content });
  }

  async function handleDeleteComment(commentId) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await api.delete(`/api/tasks/${task.id}/comments/${commentId}`);
  }

  function handleTyping() {
    socket?.emit("comment:typing", { taskId: task.id, projectId, userName: user.name });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full border-none bg-transparent font-display text-lg font-semibold text-ink outline-none"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(task.id)}
              className="rounded-lg p-2 text-ink-soft transition hover:bg-coral-light hover:text-coral"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-ink-soft hover:bg-ink/5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="label-text">Status</label>
              <select
                className="input-field text-sm"
                value={task.status}
                onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label-text">Priority</label>
              <select
                className="input-field text-sm"
                value={task.priority}
                onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label-text">Assignee</label>
              <select
                className="input-field text-sm"
                value={task.assignee_id || ""}
                onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Due date</label>
              <input
                type="date"
                className="input-field text-sm"
                value={task.due_date ? task.due_date.slice(0, 10) : ""}
                onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="label-text">Description</label>
            <textarea
              className="input-field min-h-[90px] resize-none text-sm"
              placeholder="Add more detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
            />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-ink">Comments</h4>
              {typingUser && <span className="text-xs italic text-ink-soft">{typingUser} is typing…</span>}
            </div>

            <div className="space-y-3">
              {loadingComments ? (
                <p className="text-sm text-ink-soft">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-ink-soft">No comments yet. Start the conversation.</p>
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    currentUserId={user.id}
                    onDelete={handleDeleteComment}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <form onSubmit={handleAddComment} className="flex items-center gap-2 border-t border-ink/10 px-6 py-4">
          <MemberBadge member={{ name: user.name, avatar_color: user.avatarColor }} size="md" />
          <input
            className="input-field text-sm"
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              handleTyping();
            }}
          />
          <button type="submit" className="btn-primary px-3.5">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

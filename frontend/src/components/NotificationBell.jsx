import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

export default function NotificationBell() {
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    api.get("/api/notifications").then(({ data }) => setNotifications(data.notifications));
  }, []);

  useEffect(() => {
    function onNew(payload) {
      setNotifications((prev) => [
        { id: `temp-${Date.now()}`, is_read: false, created_at: new Date().toISOString(), ...payload },
        ...prev,
      ]);
    }
    socket?.on("notification:new", onNew);
    return () => socket?.off("notification:new", onNew);
  }, [socket]);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await api.patch("/api/notifications/read-all");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-ink/10 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-teal hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">
                Nothing here yet. You'll see updates on tasks you're part of.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-ink/5 px-4 py-3 text-sm last:border-0 ${
                    n.is_read ? "text-ink-soft" : "bg-teal-light/40 text-ink"
                  }`}
                >
                  <p>{n.content}</p>
                  <p className="mt-1 text-xs text-ink-soft/70">
                    {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : "just now"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

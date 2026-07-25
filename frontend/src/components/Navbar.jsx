import { Link } from "react-router-dom";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <LayoutGrid className="h-5 w-5 text-teal" strokeWidth={2.5} />
          ProjectNext
        </Link>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="flex items-center gap-2 border-l border-ink/10 pl-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: user?.avatarColor || "#3A6B72" }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-ink sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              title="Sign out"
              className="ml-1 rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

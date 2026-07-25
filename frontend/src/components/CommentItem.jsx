import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";
import MemberBadge from "./MemberBadge";

export default function CommentItem({ comment, currentUserId, onDelete }) {
  return (
    <div className="group flex gap-2.5">
      <MemberBadge member={{ name: comment.user_name, avatar_color: comment.user_color }} size="md" />
      <div className="flex-1 rounded-lg bg-ink/5 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink">{comment.user_name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-soft">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.user_id === currentUserId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5 text-ink-soft hover:text-coral" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{comment.content}</p>
      </div>
    </div>
  );
}

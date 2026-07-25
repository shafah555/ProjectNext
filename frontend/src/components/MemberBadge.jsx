export default function MemberBadge({ member, size = "sm" }) {
  const dimension = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div
      title={member.name}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white`}
      style={{ backgroundColor: member.avatar_color || member.avatarColor || "#3A6B72" }}
    >
      {member.name?.[0]?.toUpperCase()}
    </div>
  );
}

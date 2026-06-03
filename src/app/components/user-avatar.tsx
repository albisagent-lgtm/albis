type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-3xl",
};

function initialsFromName(name: string) {
  const clean = name.replace(/^@+/, "").trim();
  if (!clean) return "A";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, imageUrl, size = "md", className = "" }: UserAvatarProps) {
  const label = `${name.replace(/^@+/, "")} profile picture`;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={label}
        className={`${sizeClass[size]} shrink-0 rounded-full border border-black/[0.08] bg-zinc-100 object-cover dark:border-white/[0.10] dark:bg-white/[0.06] ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      aria-label={label}
      className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded-full border border-[#c8922a]/30 bg-[#c8922a]/12 font-[family-name:var(--font-inter)] font-bold text-[#9b6b18] dark:text-[#f0c15e] ${className}`}
    >
      {initialsFromName(name)}
    </div>
  );
}

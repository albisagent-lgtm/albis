export type FollowTargetType = "person" | "topic" | "source";

export type FollowTarget = {
  id: string;
  type: FollowTargetType;
  label: string;
};

export const FOLLOW_STORAGE_KEY = "albis.following.v1";

export function slugifyFollow(value: string) {
  return value.toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "follow";
}

export function followTargetId(type: FollowTargetType, label: string) {
  return `${type}:${slugifyFollow(label)}`;
}

export function readFollowMap(): Record<string, FollowTarget> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FOLLOW_STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, FollowTarget>;
  } catch {
    return {};
  }
}

export function writeFollowMap(map: Record<string, FollowTarget>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("albis-following-change", { detail: map }));
}

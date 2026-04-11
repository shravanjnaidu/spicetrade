// ── Auth helpers (localStorage-based, client-side only) ──────────────────────
import type { User } from "@/types";

const KEY = "bigspice_user";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Normalise userId → id
    if (parsed.userId && !parsed.id) parsed.id = parsed.userId;
    return parsed as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function requireAuth(user: User | null, redirectTo = "/login"): void {
  if (typeof window === "undefined") return;
  if (!user) window.location.href = redirectTo;
}

/** Returns the natural dashboard route for a given role */
export function dashboardRoute(role?: string): string {
  if (role === "seller") return "/seller-dashboard";
  if (role === "advertiser") return "/advertiser-dashboard";
  return "/dashboard";
}

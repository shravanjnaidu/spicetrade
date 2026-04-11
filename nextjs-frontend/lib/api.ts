// ── API client — all calls go through Next.js rewrites to Flask backend ───────
// Base URL is empty (same-origin) by default; set NEXT_PUBLIC_API_URL for cross-origin dev
const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = JSON.parse(text)?.error || text;
    } catch {
      /* ignore */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (email: string, password: string) =>
    req<Record<string, unknown>>("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  signup: (payload: FormData | Record<string, unknown>) => {
    if (payload instanceof FormData) {
      return req<Record<string, unknown>>("/api/signup", {
        method: "POST",
        body: payload,
      });
    }
    return req<Record<string, unknown>>("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // Ads / Listings
  getAds: () => req<unknown[]>("/api/ads"),
  getAd: (id: number) => req<unknown>(`/api/ads/${id}`),
  createAd: (data: Record<string, unknown>) =>
    req<Record<string, unknown>>("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateAd: (id: number, data: Record<string, unknown>) =>
    req<Record<string, unknown>>(`/api/ads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteAd: (id: number) =>
    req<Record<string, unknown>>(`/api/ads/${id}`, { method: "DELETE" }),
  incrementAdView: (id: number) =>
    req<Record<string, unknown>>(`/api/ads/${id}/view`, { method: "POST" }),

  // Stores
  getStores: () => req<unknown[]>("/api/stores"),
  incrementStoreView: (id: number) =>
    req<Record<string, unknown>>(`/api/stores/${id}/view`, { method: "POST" }),

  // User profile
  getPublicProfile: (userId: number) =>
    req<Record<string, unknown>>(`/api/user/public/${userId}`),
  updateProfile: (data: FormData | Record<string, unknown>) => {
    if (data instanceof FormData) {
      return req<Record<string, unknown>>("/api/user/profile", {
        method: "PUT",
        body: data,
      });
    }
    return req<Record<string, unknown>>("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  // Banner ads
  getBannerAds: () => req<unknown[]>("/api/banner-ads"),
  getBannerAd: (id: number) =>
    req<Record<string, unknown>>(`/api/banner-ads/${id}`),
  getMyBannerAds: (userId: number) =>
    req<unknown[]>(`/api/banner-ads/my/${userId}`),
  createBannerAd: (data: FormData) =>
    req<Record<string, unknown>>("/api/banner-ads", {
      method: "POST",
      body: data,
    }),
  updateBannerAd: (id: number, data: FormData) =>
    req<Record<string, unknown>>(`/api/banner-ads/${id}`, {
      method: "PUT",
      body: data,
    }),
  deleteBannerAd: (id: number) =>
    req<Record<string, unknown>>(`/api/banner-ads/${id}`, { method: "DELETE" }),

  // Conversations & Messages
  getConversations: (userId: number) =>
    req<unknown[]>(`/api/conversations/${userId}`),
  startConversation: (buyerId: number, sellerId: number, listingId?: number) =>
    req<Record<string, unknown>>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId, sellerId, listingId }),
    }),
  getMessages: (conversationId: number) =>
    req<unknown[]>(`/api/messages/${conversationId}`),
  sendMessage: (conversationId: number, senderId: number, message: string) =>
    req<Record<string, unknown>>("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, senderId, message }),
    }),
  getUnreadCount: (userId: number) =>
    req<{ unreadCount: number }>(`/api/messages/unread/${userId}`),
  markMessagesRead: (conversationId: number, userId: number) =>
    req<Record<string, unknown>>(`/api/messages/mark-read/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }),

  // Wishlist
  getWishlist: (userId: number) => req<unknown[]>(`/api/wishlist/${userId}`),
  addToWishlist: (userId: number, adId: number) =>
    req<Record<string, unknown>>("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, adId }),
    }),
  removeFromWishlist: (wishlistId: number) =>
    req<Record<string, unknown>>(`/api/wishlist/${wishlistId}`, {
      method: "DELETE",
    }),
  checkWishlist: (userId: number, adId: number) =>
    req<{ inWishlist: boolean; wishlistId: number | null }>(
      "/api/wishlist/check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adId }),
      },
    ),

  // Reviews
  getReviews: (adId: number) => req<unknown[]>(`/api/reviews/${adId}`),
  getReviewStats: (adId: number) =>
    req<Record<string, unknown>>(`/api/reviews/stats/${adId}`),
  addReview: (
    adId: number,
    userId: number,
    rating: number,
    reviewText: string,
  ) =>
    req<Record<string, unknown>>("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, userId, rating, reviewText }),
    }),
  canReview: (adId: number, userId: number) =>
    req<{ canReview: boolean; reason: string }>(
      `/api/reviews/can-review/${adId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      },
    ),
  deleteReview: (reviewId: number) =>
    req<Record<string, unknown>>(`/api/reviews/${reviewId}`, {
      method: "DELETE",
    }),

  // Upload
  uploadFile: (files: File | File[]) => {
    const fd = new FormData();
    const arr = Array.isArray(files) ? files : [files];
    arr.forEach((f) => fd.append("file", f));
    return req<{ url?: string; urls?: string[]; success: boolean }>(
      "/api/upload",
      {
        method: "POST",
        body: fd,
      },
    );
  },

  // Admin
  adminGetUsers: () => req<Record<string, unknown>>("/api/admin/users"),
  adminUpdateUser: (id: number, data: Record<string, unknown>) =>
    req<Record<string, unknown>>(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  adminResetPassword: (id: number, password: string) =>
    req<Record<string, unknown>>(`/api/admin/users/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),
  adminDeleteUser: (id: number) =>
    req<Record<string, unknown>>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),
};

"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User, Ad } from "@/types";

type Tab = "all" | "sellers" | "buyers" | "listings";

interface EditModal {
  user: User;
  name: string;
  email: string;
  phone: string;
  location: string;
  storeName: string;
  businessType: string;
  address: string;
  logoUrl: string;
}

interface PasswordModal {
  userId: number;
  userName: string;
  newPwd: string;
  confirmPwd: string;
}

interface AdminAd {
  id: number;
  title: string;
  description: string;
  price: number | null;
  category: string;
  imageUrl: string;
  listingType: string;
  verified: number;
  views: number;
  createdAt: string;
  authorName: string;
  storeName: string;
  userId: number;
}

interface AdEditModal {
  ad: AdminAd;
  title: string;
  description: string;
  price: string;
  category: string;
  verified: boolean;
  imageUrl: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [adminAds, setAdminAds] = useState<AdminAd[]>([]);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [adEditModal, setAdEditModal] = useState<AdEditModal | null>(null);
  const [pwdModal, setPwdModal] = useState<PasswordModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [editError, setEditError] = useState("");
  const [adEditError, setAdEditError] = useState("");
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("admin_auth") !== "true"
    ) {
      router.replace("/admin/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, adsRes, adminAdsRes] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/ads").then((r) => r.json()),
        fetch("/api/admin/ads").then((r) => r.json()),
      ]);
      if (usersRes.success) setUsers(usersRes.users);
      if (Array.isArray(adsRes)) setAds(adsRes);
      if (adminAdsRes.success) setAdminAds(adminAdsRes.ads);
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  const openAdEdit = (a: AdminAd) =>
    setAdEditModal({
      ad: a,
      title: a.title || "",
      description: a.description || "",
      price: a.price != null ? String(a.price) : "",
      category: a.category || "",
      verified: !!a.verified,
      imageUrl: a.imageUrl || "",
    });

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      return j.url || null;
    } catch {
      return null;
    } finally {
      setUploadingImg(false);
    }
  };

  const saveAdEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!adEditModal) return;
      setSaving(true);
      setAdEditError("");
      try {
        const res = await fetch(`/api/admin/ads/${adEditModal.ad.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: adEditModal.title,
            description: adEditModal.description,
            price:
              adEditModal.price !== "" ? parseFloat(adEditModal.price) : null,
            category: adEditModal.category,
            verified: adEditModal.verified,
            imageUrl: adEditModal.imageUrl || undefined,
          }),
        });
        const j = await res.json();
        if (j.success) {
          setAdEditModal(null);
          loadData();
        } else setAdEditError(j.error || j.message || "Failed to save.");
      } catch {
        setAdEditError("Network error.");
      }
      setSaving(false);
    },
    [adEditModal],
  );

  const deleteAd = async (id: number) => {
    if (!confirm("Delete this listing? This action is irreversible.")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    loadData();
  };

  const openEdit = (u: User) =>
    setEditModal({
      user: u,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      location: u.location || "",
      storeName: u.storeName || "",
      businessType: u.businessType || "",
      address: u.address || "",
      logoUrl: u.logo || "",
    });

  const saveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editModal) return;
      setSaving(true);
      setEditError("");
      try {
        const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editModal.name,
            email: editModal.email,
            phone: editModal.phone,
            location: editModal.location,
            storeName: editModal.storeName,
            businessType: editModal.businessType,
            address: editModal.address,
            logo_path: editModal.logoUrl || undefined,
          }),
        });
        const j = await res.json();
        if (j.success) {
          setEditModal(null);
          loadData();
        } else setEditError(j.error || j.message || "Failed to save.");
      } catch {
        setEditError("Network error.");
      }
      setSaving(false);
    },
    [editModal],
  );

  const savePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pwdModal) return;
      if (pwdModal.newPwd !== pwdModal.confirmPwd) {
        setPwdError("Passwords do not match.");
        return;
      }
      if (pwdModal.newPwd.length < 6) {
        setPwdError("Password must be at least 6 characters.");
        return;
      }
      setSaving(true);
      setPwdError("");
      try {
        const res = await fetch(
          `/api/admin/users/${pwdModal.userId}/password`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pwdModal.newPwd }),
          },
        );
        const j = await res.json();
        if (j.success) {
          setPwdModal(null);
        } else setPwdError(j.error || j.message || "Failed to reset password.");
      } catch {
        setPwdError("Network error.");
      }
      setSaving(false);
    },
    [pwdModal],
  );

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user? This action is irreversible.")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadData();
  };

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    router.push("/admin/login");
  };

  const sellers = users.filter((u) => u.role === "seller");
  const buyers = users.filter((u) => u.role === "buyer" || !u.role);

  const displayedUsers: User[] =
    tab === "sellers"
      ? sellers
      : tab === "buyers"
        ? buyers
        : tab === "listings"
          ? []
          : users;

  const Avatar = ({ u }: { u: User }) =>
    u.profilePicture || u.logo ? (
      <img
        src={(u.profilePicture || u.logo)!}
        alt={u.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d35400] to-amber-400 flex items-center justify-center text-white text-xs font-bold">
        {(u.name || "U").charAt(0).toUpperCase()}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {/* Admin header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/logos/bigspicelogo.png" alt="BigSpice" className="h-9" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">
            Admin Dashboard
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-[#d35400] hover:text-[#d35400] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto w-full px-4 py-10">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length },
            { label: "Sellers", value: sellers.length },
            { label: "Buyers", value: buyers.length },
            { label: "Total Listings", value: ads.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-[#d35400]">
                {loading ? "—" : value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-200">
          {(["all", "sellers", "buyers", "listings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-[#d35400] text-[#d35400]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t === "all" ? "All Users" : t === "listings" ? "Listings" : t}
            </button>
          ))}
        </div>

        {/* Listings table */}
        {tab === "listings" ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Loading listings…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Seller
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Views
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminAds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-10 text-center text-gray-400"
                      >
                        No listings found
                      </td>
                    </tr>
                  ) : (
                    adminAds.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {a.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                          <Link
                            href={`/listing/${a.id}`}
                            target="_blank"
                            className="hover:text-[#d35400] hover:underline line-clamp-2"
                          >
                            {a.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {a.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.price != null
                            ? `₹${parseFloat(String(a.price)).toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {a.storeName || a.authorName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.listingType === "requirement" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                          >
                            {a.listingType === "requirement"
                              ? "Req"
                              : "Product"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {a.verified ? (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {a.views ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openAdEdit(a)}
                              className="border border-blue-500 text-blue-600 text-xs px-2.5 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAd(a.id)}
                              className="border border-red-400 text-red-500 text-xs px-2.5 py-1 rounded hover:bg-red-50"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Users table */
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Loading users…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Avatar
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Role
                    </th>
                    {tab === "sellers" && (
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Store
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-gray-400"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Avatar u={u} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {u.uniqueId || u.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {u.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {u.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "seller" ? "bg-green-100 text-green-700" : u.role === "advertiser" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {u.role || "buyer"}
                          </span>
                        </td>
                        {tab === "sellers" && (
                          <td className="px-4 py-3 text-gray-600">
                            {u.storeName || "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="border border-blue-500 text-blue-600 text-xs px-2.5 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setPwdModal({
                                  userId: u.id,
                                  userName: u.name || u.email || "",
                                  newPwd: "",
                                  confirmPwd: "",
                                })
                              }
                              className="border border-amber-500 text-amber-600 text-xs px-2.5 py-1 rounded hover:bg-amber-50"
                            >
                              Pwd
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="border border-red-400 text-red-500 text-xs px-2.5 py-1 rounded hover:bg-red-50"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Edit listing modal */}
      {adEditModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setAdEditModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Edit Listing</h3>
              <button
                onClick={() => setAdEditModal(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={saveAdEdit} className="space-y-4">
              {/* Product image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {adEditModal.imageUrl ? (
                      <img
                        src={adEditModal.imageUrl}
                        alt="product"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {uploadingImg ? "Uploading…" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImg}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImage(file);
                          if (url) setAdEditModal((m) => m ? { ...m, imageUrl: url } : m);
                        }}
                      />
                    </label>
                    {adEditModal.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setAdEditModal((m) => m ? { ...m, imageUrl: "" } : m)}
                        className="mt-2 text-xs text-red-500 hover:underline block"
                      >
                        Remove image
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">JPG, PNG or WebP. Auto-converted to WebP.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={adEditModal.title}
                  onChange={(e) =>
                    setAdEditModal((m) =>
                      m ? { ...m, title: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={adEditModal.category}
                  onChange={(e) =>
                    setAdEditModal((m) =>
                      m ? { ...m, category: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adEditModal.price}
                  onChange={(e) =>
                    setAdEditModal((m) =>
                      m ? { ...m, price: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                  placeholder="Leave blank for price on request"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={adEditModal.description}
                  onChange={(e) =>
                    setAdEditModal((m) =>
                      m ? { ...m, description: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400] resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified-check"
                  checked={adEditModal.verified}
                  onChange={(e) =>
                    setAdEditModal((m) =>
                      m ? { ...m, verified: e.target.checked } : m,
                    )
                  }
                  className="w-4 h-4 accent-[#d35400]"
                />
                <label
                  htmlFor="verified-check"
                  className="text-sm text-gray-700"
                >
                  Mark as Verified
                </label>
              </div>
              {adEditError && (
                <p className="text-sm text-red-600">{adEditError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#d35400] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b84700] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdEditModal(null)}
                  className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Edit User</h3>
              <button
                onClick={() => setEditModal(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              {/* Seller logo */}
              {editModal.user.role === "seller" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Logo
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                      {editModal.logoUrl ? (
                        <img
                          src={editModal.logoUrl}
                          alt="logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#d35400] to-amber-400">
                          <span className="text-white text-2xl font-bold">
                            {(editModal.user.name || "S").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {uploadingImg ? "Uploading…" : "Upload Logo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImg}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await uploadImage(file);
                            if (url) setEditModal((m) => m ? { ...m, logoUrl: url } : m);
                          }}
                        />
                      </label>
                      {editModal.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditModal((m) => m ? { ...m, logoUrl: "" } : m)}
                          className="mt-2 text-xs text-red-500 hover:underline block"
                        >
                          Remove logo
                        </button>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">JPG, PNG or WebP. Auto-converted to WebP.</p>
                    </div>
                  </div>
                </div>
              )}
              {[
                {
                  label: "Name",
                  value: editModal.name,
                  key: "name",
                  type: "text",
                },
                {
                  label: "Email",
                  value: editModal.email,
                  key: "email",
                  type: "email",
                },
                {
                  label: "Phone",
                  value: editModal.phone,
                  key: "phone",
                  type: "tel",
                },
                {
                  label: "Location",
                  value: editModal.location,
                  key: "location",
                  type: "text",
                },
              ].map(({ label, value, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={value}
                    required={["name", "email"].includes(key)}
                    onChange={(e) =>
                      setEditModal((m) =>
                        m ? { ...m, [key]: e.target.value } : m,
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </div>
              ))}
              {editModal.user.role === "seller" && (
                <>
                  {[
                    {
                      label: "Store Name",
                      key: "storeName",
                      value: editModal.storeName,
                    },
                    {
                      label: "Business Type",
                      key: "businessType",
                      value: editModal.businessType,
                    },
                    {
                      label: "Address",
                      key: "address",
                      value: editModal.address,
                    },
                  ].map(({ label, key, value }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        value={value}
                        onChange={(e) =>
                          setEditModal((m) =>
                            m ? { ...m, [key]: e.target.value } : m,
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                      />
                    </div>
                  ))}
                </>
              )}
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {pwdModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPwdModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Reset Password</h3>
              <button
                onClick={() => setPwdModal(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter a new password for{" "}
              <strong className="text-gray-800">{pwdModal.userName}</strong>
            </p>
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwdModal.newPwd}
                  onChange={(e) =>
                    setPwdModal((m) =>
                      m ? { ...m, newPwd: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwdModal.confirmPwd}
                  onChange={(e) =>
                    setPwdModal((m) =>
                      m ? { ...m, confirmPwd: e.target.value } : m,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
              {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Resetting…" : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setPwdModal(null)}
                  className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

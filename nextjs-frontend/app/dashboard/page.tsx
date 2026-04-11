"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { CATEGORY_GROUPS, CATEGORY_TAGS } from "@/lib/categories";
import type { Ad, User } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    fetchRequirements(u.id);
  }, []);

  const fetchRequirements = async (userId: number) => {
    setLoading(true);
    try {
      const ads: Ad[] = await fetch("/api/ads").then((r) => r.json());
      setRequirements(
        ads.filter(
          (a) => a.userId === userId && a.listingType === "requirement",
        ),
      );
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  const populateForm = (req: Ad) => {
    setEditingId(req.id);
    setTitle(req.title);
    setDescription(req.description || "");
    setCategory(req.category || "");
    setTags(req.tags || []);
    setMinOrder(req.minOrder != null ? String(req.minOrder) : "");
    setPrice(req.price != null ? String(req.price) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setTags([]);
    setTagInput("");
    setMinOrder("");
    setPrice("");
    setError("");
  };

  const addTag = (val: string) => {
    const t = val.trim();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSubmitting(true);
      setError("");
      setSuccess("");
      const body = {
        userId: user.id,
        title,
        description,
        category,
        tags,
        minOrder: minOrder ? parseInt(minOrder) : null,
        price: price ? parseFloat(price) : null,
        listingType: "requirement",
      };
      try {
        let res;
        if (editingId) {
          res = await fetch(`/api/ads/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          res = await fetch("/api/ads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        const j = await res.json();
        if (j.success) {
          setSuccess(
            editingId ? "Requirement updated!" : "Requirement posted!",
          );
          cancelEdit();
          fetchRequirements(user.id);
        } else {
          setError(j.error || j.message || "Failed to save requirement.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
      setSubmitting(false);
    },
    [user, title, description, category, tags, minOrder, price, editingId],
  );

  const deleteRequirement = async (id: number) => {
    if (!confirm("Delete this requirement?")) return;
    await fetch(`/api/ads/${id}`, { method: "DELETE" });
    if (user) fetchRequirements(user.id);
  };

  const availableTags = category ? CATEGORY_TAGS[category] || [] : [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f7f8fa]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-blue-600 text-sm mb-6 hover:underline"
          >
            ← Back to Home
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              My Requirements
            </h1>
            <p className="text-gray-500 text-sm">
              Post sourcing requirements here. They'll be visible on the
              marketplace homepage for sellers to respond.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingId ? "Edit Requirement" : "Post a New Requirement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Looking for bulk cardamom supplier"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe what you need — quantity, quality, delivery timeline, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-[#d35400]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setTags([]);
                    }}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                  >
                    <option value="">Select category</option>
                    {CATEGORY_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.items.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              {category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tags{" "}
                    <span className="font-normal text-gray-400">
                      (optional, up to 5)
                    </span>
                  </label>
                  {availableTags.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">
                        Suggested — click to add:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTags
                          .filter((t) => !tags.includes(t))
                          .map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => addTag(t)}
                              disabled={tags.length >= 5}
                              className="text-xs bg-orange-50 text-[#d35400] border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              + {t}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Or type a custom tag…"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="px-4 py-2 bg-[#d35400] text-white text-sm rounded-lg hover:bg-[#b84700]"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="text-gray-400 hover:text-red-500 leading-none text-base"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Min. Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Budget / Price (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g., 5.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                  />
                </div>
              </div>

              {success && (
                <p className="text-sm text-green-600 font-medium">{success}</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting
                    ? "Saving…"
                    : editingId
                      ? "Update Requirement"
                      : "Post Requirement"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="border border-blue-600 text-blue-600 px-5 py-2.5 rounded-lg text-sm hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* My requirements list */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              My Posted Requirements
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : requirements.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                No requirements posted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {req.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {req.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {req.category && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              {req.category}
                            </span>
                          )}
                          {(req.tags || []).map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-[#eef2ff] text-blue-700 px-2 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 ml-auto">
                            {req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => populateForm(req)}
                          className="border border-blue-600 text-blue-600 text-xs px-3 py-1.5 rounded-md hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRequirement(req.id)}
                          className="border border-red-400 text-red-500 text-xs px-3 py-1.5 rounded-md hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

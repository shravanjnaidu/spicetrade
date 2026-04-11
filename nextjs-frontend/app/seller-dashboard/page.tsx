"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { CATEGORY_GROUPS, CATEGORY_TAGS } from "@/lib/categories";
import type { Ad, User } from "@/types";

const UNITS = [
  "piece",
  "kg",
  "lb",
  "ton",
  "box",
  "carton",
  "bag",
  "pallet",
  "litre",
  "gallon",
];

// ── Shared form modal ─────────────────────────────────────────────────────────
interface AdFormModalProps {
  mode: "product" | "service";
  editing: Ad | null;
  userId: number;
  onClose: () => void;
  onSaved: () => void;
}

function AdFormModal({
  mode,
  editing,
  userId,
  onClose,
  onSaved,
}: AdFormModalProps) {
  const isEdit = !!editing;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(
    editing?.price != null ? String(editing.price) : "",
  );
  const [unit, setUnit] = useState(editing?.unit ?? "kg");
  const [minOrder, setMinOrder] = useState(
    editing?.minOrder != null ? String(editing.minOrder) : "1",
  );
  const [category, setCategory] = useState(editing?.category ?? "");
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [stock, setStock] = useState(
    editing?.stock != null ? String(editing.stock) : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    if (!editing) return [];
    const main = editing.imageUrl ? [editing.imageUrl] : [];
    if (!editing.images) return main;
    try {
      return [...main, ...JSON.parse(editing.images)];
    } catch {
      return main;
    }
  });

  const addTag = (v: string) => {
    const t = v.trim();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImgFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Upload new images
      let imageUrl = existingImages[0] || "";
      const extraUrls: string[] = existingImages.slice(1);
      for (const file of imgFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (j.url) {
          if (!imageUrl) imageUrl = j.url;
          else extraUrls.push(j.url);
        }
      }
      const body = {
        userId,
        title,
        description,
        price: price ? parseFloat(price) : null,
        unit: mode === "product" ? unit : undefined,
        minOrder: minOrder ? parseInt(minOrder) : null,
        category,
        tags,
        stock: stock ? parseInt(stock) : null,
        imageUrl: imageUrl || null,
        images: extraUrls.length > 0 ? JSON.stringify(extraUrls) : null,
        listingType: mode,
      };
      const url = isEdit ? `/api/ads/${editing!.id}` : "/api/ads";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.success) {
        onSaved();
        onClose();
      } else setError(j.error || j.message || "Failed to save.");
    } catch {
      setError("Network error.");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-gray-900">
            {isEdit ? "Edit" : "Add"}{" "}
            {mode === "product" ? "Product" : "Service"}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700 leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === "product" ? "Product" : "Service"} Name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-[#d35400]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === "product" ? "Price *" : "Starting Price *"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
              />
            </div>
            {mode === "product" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {mode === "product" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. Order *
                </label>
                <input
                  type="number"
                  min="1"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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

          {/* Tag suggestions from category */}
          {category && CATEGORY_TAGS[category]?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                Suggested tags — click to add:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TAGS[category]
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

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="font-normal text-gray-400">(up to 5)</span>
            </label>
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
                placeholder="Type a tag…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="px-3 py-2 bg-[#d35400] text-white text-sm rounded-lg hover:bg-[#b84700]"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-gray-400 hover:text-red-500 text-base leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (up to 10)
            </label>
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt=""
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExistingImages((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imgFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {imgFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImgFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImgChange}
              className="text-sm text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Select up to 10 images total.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : isEdit
                  ? `Update ${mode === "product" ? "Product" : "Service"}`
                  : `Add ${mode === "product" ? "Product" : "Service"}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Listing item row ───────────────────────────────────────────────────────────
function AdRow({
  ad,
  onEdit,
  onDelete,
}: {
  ad: Ad;
  onEdit: (a: Ad) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-12 h-12 object-cover rounded shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {ad.title}
          </p>
          <p className="text-xs text-gray-400">
            {ad.category}{" "}
            {ad.price != null
              ? `· ₹${parseFloat(String(ad.price)).toFixed(2)}/${ad.unit || "unit"}`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(ad)}
          className="border border-blue-500 text-blue-600 text-xs px-3 py-1.5 rounded-md hover:bg-blue-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(ad.id)}
          className="border border-red-400 text-red-500 text-xs px-3 py-1.5 rounded-md hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Ad[]>([]);
  const [services, setServices] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    mode: "product" | "service";
    editing: Ad | null;
  } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    if (u.role !== "seller") {
      router.push("/dashboard");
      return;
    }
    setUser(u);
    fetchlistings(u.id);
  }, []);

  const fetchlistings = async (userId: number) => {
    setLoading(true);
    try {
      const ads: Ad[] = await fetch("/api/ads").then((r) => r.json());
      const mine = ads.filter((a) => a.userId === userId);
      setProducts(
        mine.filter((a) => a.listingType === "product" || !a.listingType),
      );
      setServices(mine.filter((a) => a.listingType === "service"));
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  const deleteAd = async (id: number) => {
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/ads/${id}`, { method: "DELETE" });
    if (user) fetchlistings(user.id);
  };

  const openAdd = (mode: "product" | "service") =>
    setModal({ mode, editing: null });
  const openEdit = (ad: Ad) =>
    setModal({
      mode: ad.listingType === "service" ? "service" : "product",
      editing: ad,
    });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f7f8fa]">
        <div className="max-w-screen-lg mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Seller Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your store, products and services
            </p>
          </div>

          {/* Top grid: store details + quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Store details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Store Details
              </h2>
              {user && (
                <div className="divide-y divide-gray-100">
                  {[
                    { label: "Unique ID", value: user.uniqueId, accent: true },
                    { label: "Store Name", value: user.storeName },
                    { label: "Business Type", value: user.businessType },
                    { label: "Email", value: user.email },
                    { label: "Location", value: user.location || user.address },
                    { label: "Website", value: user.website },
                  ]
                    .filter((r) => r.value)
                    .map(({ label, value, accent }) => (
                      <div key={label} className="flex justify-between py-2.5">
                        <span className="text-sm font-semibold text-gray-500">
                          {label}
                        </span>
                        <span
                          className={`text-sm ${accent ? "font-bold text-[#d35400]" : "text-gray-900"}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/profile"
                  className="inline-block border border-blue-600 text-blue-600 text-sm px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Edit Store Details
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Quick Stats
              </h2>
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between py-2.5">
                  <span className="text-sm font-semibold text-gray-500">
                    Total Products
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {loading ? "—" : products.length}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm font-semibold text-gray-500">
                    Total Services
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {loading ? "—" : services.length}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm font-semibold text-gray-500">
                    Member Since
                  </span>
                  <span className="text-sm text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
              {user && (
                <div className="mt-4">
                  <Link
                    href={`/store/${user.id}`}
                    className="inline-block text-sm text-blue-600 hover:underline"
                  >
                    View public store →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Products section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Products</h2>
              <button
                onClick={() => openAdd("product")}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Product
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No products added yet. Click "Add Product" to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <AdRow
                    key={p.id}
                    ad={p}
                    onEdit={openEdit}
                    onDelete={deleteAd}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Services section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Services</h2>
              <button
                onClick={() => openAdd("service")}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Service
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(1)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No services added yet. Click "Add Service" to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <AdRow
                    key={s.id}
                    ad={s}
                    onEdit={openEdit}
                    onDelete={deleteAd}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {modal && user && (
        <AdFormModal
          mode={modal.mode}
          editing={modal.editing}
          userId={user.id}
          onClose={() => setModal(null)}
          onSaved={() => user && fetchlistings(user.id)}
        />
      )}
    </>
  );
}

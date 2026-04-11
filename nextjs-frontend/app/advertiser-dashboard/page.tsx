"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { clearUser } from "@/lib/auth";
import type { BannerAd, User } from "@/types";

const INDUSTRIES = [
  "Events & Expos",
  "Food & Agriculture",
  "Industrial & Manufacturing",
  "Technology",
  "Retail & E-commerce",
  "Healthcare & Pharma",
  "Real Estate",
  "Education & Training",
  "Logistics & Supply Chain",
  "Other",
];

export default function AdvertiserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [industry, setIndustry] = useState("");
  const [adAddress, setAdAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    if (u.role !== "advertiser") {
      router.push("/dashboard");
      return;
    }
    setUser(u);
    fetchAds(u.id);
  }, []);

  const fetchAds = async (userId: number) => {
    setLoading(true);
    try {
      const data: BannerAd[] = await fetch(`/api/banner-ads/my/${userId}`).then(
        (r) => r.json(),
      );
      setAds(Array.isArray(data) ? data : []);
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setBannerFile(null);
    setBannerPreview("");
    setAdTitle("");
    setAdDescription("");
    setTargetUrl("");
    setExpiresAt("");
    setContactName("");
    setContactNumber("");
    setIndustry("");
    setAdAddress("");
    setNotes("");
    setFormError("");
  };

  const populateForm = (ad: BannerAd) => {
    setEditingId(ad.id);
    setBannerPreview(ad.imageUrl || "");
    setAdTitle(ad.title || "");
    setAdDescription(ad.description || "");
    setTargetUrl(ad.targetUrl || "");
    setExpiresAt(ad.expiresAt ? ad.expiresAt.split("T")[0] : "");
    setContactName(ad.contactName || "");
    setContactNumber(ad.contactNumber || "");
    setIndustry(ad.industry || "");
    setAdAddress(ad.adAddress || "");
    setNotes(ad.notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBannerFile(f);
    setBannerPreview(URL.createObjectURL(f));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSubmitting(true);
      setFormError("");
      setFormSuccess("");
      try {
        const fd = new FormData();
        if (bannerFile) fd.append("image", bannerFile);
        fd.append("userId", String(user.id));
        fd.append("title", adTitle);
        fd.append("description", adDescription);
        fd.append("targetUrl", targetUrl);
        if (expiresAt) fd.append("expiresAt", expiresAt);
        fd.append("contactName", contactName);
        fd.append("contactNumber", contactNumber);
        fd.append("industry", industry);
        fd.append("adAddress", adAddress);
        fd.append("notes", notes);

        const url = editingId
          ? `/api/banner-ads/${editingId}`
          : "/api/banner-ads";
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, { method, body: fd });
        const j = await res.json();
        if (j.success) {
          setFormSuccess(
            editingId ? "Ad updated successfully!" : "Banner ad published!",
          );
          resetForm();
          if (user) fetchAds(user.id);
        } else {
          setFormError(j.error || j.message || "Failed to save ad.");
        }
      } catch {
        setFormError("Network error. Please try again.");
      }
      setSubmitting(false);
    },
    [
      user,
      bannerFile,
      adTitle,
      adDescription,
      targetUrl,
      expiresAt,
      contactName,
      contactNumber,
      industry,
      adAddress,
      notes,
      editingId,
    ],
  );

  const deleteAd = async (id: number) => {
    if (!confirm("Delete this banner ad?")) return;
    await fetch(`/api/banner-ads/${id}`, { method: "DELETE" });
    if (user) fetchAds(user.id);
  };

  const totalAds = ads.length;
  const now = new Date();
  const activeAds = ads.filter(
    (a) => !a.expiresAt || new Date(a.expiresAt) >= now,
  ).length;
  const expiredAds = ads.filter(
    (a) => a.expiresAt && new Date(a.expiresAt) < now,
  ).length;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f5f6f7]">
        <div className="max-w-screen-md mx-auto px-5 py-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Advertiser Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Manage your banner ads on the BigSpice marketplace
            </p>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Ads", value: loading ? "—" : totalAds },
              { label: "Active", value: loading ? "—" : activeAds },
              { label: "Expired", value: loading ? "—" : expiredAds },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm"
              >
                <p className="text-3xl font-bold text-[#e47911]">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Create / Edit form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editingId ? "Edit Banner Ad" : "Create a Banner Ad"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Your ad will appear in the homepage carousel after approval.
            </p>

            {/* Spec box */}
            <div className="bg-amber-50 border border-dashed border-[#e47911] rounded-lg p-4 mb-5 text-sm text-gray-600">
              <strong className="text-[#c85e00]">Recommended image:</strong>{" "}
              1200 × 400 px, JPG/PNG/WebP, under 2 MB.
              <ul className="mt-1 ml-4 list-disc text-xs text-gray-500 space-y-0.5">
                <li>Use 3:1 aspect ratio for best display</li>
                <li>Keep text minimal — title is overlaid separately</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Banner Image {!editingId && "*"}
                </label>
                <label className="relative block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#e47911] hover:bg-amber-50 transition-colors">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required={!editingId && !bannerPreview}
                  />
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">🖼️</p>
                      <p className="text-sm text-gray-500">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, WebP · max 2 MB
                      </p>
                    </div>
                  )}
                </label>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview("");
                    }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Title + Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ad Title *
                  </label>
                  <input
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="e.g., SpiceExpo 2026 — Register Now"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Shown as heading on the carousel slide
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subtitle / Description
                  </label>
                  <input
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    maxLength={120}
                    placeholder="e.g., Asia's largest spice expo · Oct 12–14, Mumbai"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Shown as smaller text below the title
                  </p>
                </div>
              </div>

              {/* URL + Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    required
                    placeholder="https://yourwebsite.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Opens in a new tab when slide is clicked
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiry Date{" "}
                    <span className="font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ad stops showing after this date
                  </p>
                </div>
              </div>

              {/* Contact & details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  Ad Contact &amp; Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Person{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g., Ramesh Kumar"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Industry / Category *
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                    >
                      <option value="">— Select —</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Event / Ad Location{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={adAddress}
                      onChange={(e) => setAdAddress(e.target.value)}
                      placeholder="e.g., Bombay Exhibition Centre, Mumbai"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e47911]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Additional Notes{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any extra information about the ad or event…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-[#e47911]"
                    />
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
              {formSuccess && (
                <p className="text-sm text-green-600 font-medium">
                  {formSuccess}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#e47911] text-white px-7 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#c85e00] disabled:opacity-50 transition-colors"
                >
                  {submitting
                    ? "Publishing…"
                    : editingId
                      ? "Update Ad"
                      : "Publish Banner Ad"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-gray-400 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* My Ads list */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              My Banner Ads
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : ads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No banner ads yet. Create one using the form above.
              </p>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => {
                  const expired = ad.expiresAt
                    ? new Date(ad.expiresAt) < now
                    : false;
                  return (
                    <div
                      key={ad.id}
                      className={`flex gap-4 p-4 rounded-lg border ${expired ? "border-gray-200 opacity-70 bg-gray-50" : "border-gray-200 bg-white"}`}
                    >
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-28 h-16 object-cover rounded shrink-0 border border-gray-200"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate flex-1">
                            {ad.title}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${expired ? "bg-gray-200 text-gray-500" : "bg-green-100 text-green-700"}`}
                          >
                            {expired ? "Expired" : "Active"}
                          </span>
                        </div>
                        {ad.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {ad.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                          {ad.industry && <span>{ad.industry}</span>}
                          {ad.expiresAt && (
                            <span>
                              · Expires:{" "}
                              {new Date(ad.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => populateForm(ad)}
                          className="border border-blue-500 text-blue-600 text-xs px-3 py-1.5 rounded-md hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="border border-red-400 text-red-500 text-xs px-3 py-1.5 rounded-md hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

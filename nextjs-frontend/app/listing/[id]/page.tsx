"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import type { Ad, Review, ReviewStats, User } from "@/types";

// ── Stars ──────────────────────────────────────────────────────────────────────
function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const full = Math.floor(rating);
  const cls =
    size === "lg" ? "text-xl text-[#ffa41c]" : "text-sm text-[#ffa41c]";
  return (
    <span className={cls}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

// ── Star input ─────────────────────────────────────────────────────────────────
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl transition-colors ${n <= (hover || value) ? "text-[#ffa41c]" : "text-gray-300"}`}
          aria-label={`Rate ${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Rating bar ─────────────────────────────────────────────────────────────────
function RatingBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-blue-600 w-12 text-right shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-[#ffa41c] rounded transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-500 w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const adId = parseInt(id, 10);

  const [ad, setAd] = useState<Ad | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review form
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!adId) return;
    // Increment view
    fetch(`/api/ads/${adId}/view`, { method: "POST" }).catch(() => {});

    Promise.all([
      fetch(`/api/ads`)
        .then((r) => r.json())
        .then((ads: Ad[]) => ads.find((a) => a.id === adId) || null)
        .catch(() => null),
      fetch(`/api/reviews/${adId}`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`/api/reviews/stats/${adId}`)
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([adData, revs, sts]) => {
      setAd(adData);
      if (adData?.imageUrl) setSelectedImg(adData.imageUrl);
      setReviews(revs as Review[]);
      setStats(sts as ReviewStats);
      setLoading(false);
    });
  }, [adId]);

  // Check wishlist status
  useEffect(() => {
    if (!user?.id || !adId) return;
    fetch("/api/wishlist/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, adId }),
    })
      .then((r) => r.json())
      .then((j) => {
        setInWishlist(j.inWishlist);
        setWishlistId(j.wishlistId);
      })
      .catch(() => {});
  }, [user, adId]);

  // Check can review
  useEffect(() => {
    if (!user?.id || !adId) return;
    fetch(`/api/reviews/can-review/${adId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((r) => r.json())
      .then((j) => setCanReview(j.canReview ?? false))
      .catch(() => {});
  }, [user, adId]);

  const toggleWishlist = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist && wishlistId) {
        await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
        setInWishlist(false);
        setWishlistId(null);
      } else {
        const r = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, adId }),
        });
        const j = await r.json();
        if (j.success) {
          setInWishlist(true);
          setWishlistId(j.wishlistId);
        }
      }
    } finally {
      setWishlistLoading(false);
    }
  }, [user, inWishlist, wishlistId, adId, router]);

  const contactSeller = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!ad?.userId) return;
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: ad.userId,
          listingId: adId,
        }),
      });
      const j = await r.json();
      if (j.success) router.push("/messages");
    } catch {
      alert("Failed to start conversation. Please try again.");
    }
  }, [user, ad, adId, router]);

  const submitReview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !reviewRating) return;
      setReviewSubmitting(true);
      setReviewError("");
      try {
        const r = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adId,
            userId: user.id,
            rating: reviewRating,
            reviewText,
          }),
        });
        const j = await r.json();
        if (j.success) {
          setReviewRating(0);
          setReviewText("");
          setCanReview(false);
          // Refresh reviews
          const [revs, sts] = await Promise.all([
            fetch(`/api/reviews/${adId}`).then((r) => r.json()),
            fetch(`/api/reviews/stats/${adId}`).then((r) => r.json()),
          ]);
          setReviews(revs);
          setStats(sts);
        } else {
          setReviewError(j.message || j.error || "Failed to submit review.");
        }
      } catch {
        setReviewError("Network error.");
      } finally {
        setReviewSubmitting(false);
      }
    },
    [user, reviewRating, reviewText, adId],
  );

  // Parse extra images
  const extraImages = (() => {
    if (!ad?.images) return [];
    try {
      return JSON.parse(ad.images) as string[];
    } catch {
      return [];
    }
  })();
  const allImages = [ad?.imageUrl, ...extraImages].filter(
    (u) => u && u !== "",
  ) as string[];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading listing…
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-gray-700">Listing not found</h2>
        <Link
          href="/listings"
          className="text-[#d35400] hover:underline text-sm"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#d35400]">
              Home
            </Link>
            <span>›</span>
            <Link href="/listings" className="hover:text-[#d35400]">
              Listings
            </Link>
            {ad.category && (
              <>
                <span>›</span>
                <Link
                  href={`/listings?category=${encodeURIComponent(ad.category)}`}
                  className="hover:text-[#d35400]"
                >
                  {ad.category}
                </Link>
              </>
            )}
            <span>›</span>
            <span className="text-gray-700 truncate max-w-xs">{ad.title}</span>
          </div>

          {/* Main product layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_320px] gap-6">
            {/* Image gallery */}
            <div className="flex gap-2">
              {allImages.length > 1 && (
                <div className="flex flex-col gap-2">
                  {allImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${ad.title} ${i + 1}`}
                      onClick={() => setSelectedImg(img)}
                      className={`w-14 h-14 object-cover border-2 rounded cursor-pointer transition-colors ${selectedImg === img ? "border-[#ffa41c]" : "border-gray-200 hover:border-gray-400"}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <div className="flex-1">
                {selectedImg || ad.imageUrl ? (
                  <img
                    src={selectedImg || ad.imageUrl!}
                    alt={ad.title}
                    className="w-full max-h-96 object-contain bg-gray-50 border border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="space-y-4">
              <h1 className="text-2xl font-normal text-gray-900 leading-snug">
                {ad.title}
              </h1>

              {/* Rating row */}
              {(ad.reviewCount ?? 0) > 0 && (
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <Stars rating={ad.averageRating ?? 0} />
                  <a
                    href="#reviews"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {ad.reviewCount} rating{ad.reviewCount !== 1 ? "s" : ""}
                  </a>
                  <span className="text-gray-300">|</span>
                  {ad.views != null && (
                    <span className="text-sm text-gray-400">
                      {ad.views} views
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              {ad.price != null ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-3xl font-normal text-gray-900">
                    ₹{parseFloat(String(ad.price)).toFixed(2)}
                    {ad.unit && (
                      <span className="text-lg text-gray-500 ml-1">
                        / {ad.unit}
                      </span>
                    )}
                  </p>
                  {ad.minOrder && (
                    <p className="text-sm text-gray-500 mt-1">
                      Min. order: {ad.minOrder} {ad.unit || "units"}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Price on request</p>
              )}

              {/* Details */}
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  Product Details
                </h2>
                {[
                  { label: "Category", value: ad.category },
                  {
                    label: "Stock",
                    value:
                      ad.stock != null
                        ? ad.stock > 0
                          ? `${ad.stock} available`
                          : "Out of stock"
                        : null,
                  },
                  { label: "Seller", value: ad.storeName || ad.author },
                  {
                    label: "Listed",
                    value: ad.createdAt
                      ? new Date(ad.createdAt).toLocaleDateString()
                      : null,
                  },
                  {
                    label: "Type",
                    value:
                      ad.listingType === "requirement"
                        ? "Requirement"
                        : "Product/Service",
                  },
                ]
                  .filter((r) => r.value)
                  .map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex py-2 border-b border-gray-100"
                    >
                      <span className="w-32 text-sm text-gray-500 shrink-0">
                        {label}
                      </span>
                      <span className="text-sm text-gray-900">{value}</span>
                    </div>
                  ))}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ad.description}
                </p>
              </div>

              {/* Tags */}
              {ad.tags && ad.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ad.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Seller link */}
              {ad.userId && (
                <Link
                  href={`/store/${ad.userId}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  Visit seller store: {ad.storeName || ad.author}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Buy box */}
            <div className="border border-gray-300 rounded-lg p-5 space-y-4 h-fit sticky top-20">
              {ad.price != null && (
                <p className="text-2xl font-normal text-gray-900">
                  ₹{parseFloat(String(ad.price)).toFixed(2)}
                  {ad.unit && (
                    <span className="text-sm text-gray-500 ml-1">
                      /{ad.unit}
                    </span>
                  )}
                </p>
              )}

              {ad.stock != null && (
                <p
                  className={`text-sm font-medium ${ad.stock > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {ad.stock > 0 ? `In Stock (${ad.stock})` : "Out of Stock"}
                </p>
              )}

              {/* Seller info */}
              <div className="py-3 border-t border-b border-gray-200 space-y-1.5">
                <p className="text-xs text-gray-500">Sold by</p>
                <Link
                  href={`/store/${ad.userId}`}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  {ad.storeName || ad.author || "View Seller"}
                </Link>
              </div>

              {ad.verified ? (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Verified Listing
                </p>
              ) : null}

              <button
                onClick={contactSeller}
                disabled={user?.id === ad.userId}
                className="w-full bg-[#d35400] text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {user?.id === ad.userId ? "Your listing" : "Contact Seller"}
              </button>

              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  inWishlist
                    ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-300 text-gray-700 hover:border-[#d35400] hover:text-[#d35400]"
                }`}
              >
                {wishlistLoading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`w-5 h-5 transition-colors ${inWishlist ? "fill-red-500 text-red-500" : "fill-none text-gray-500"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
                {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>
          </div>

          {/* ── Reviews section ── */}
          <div id="reviews" className="mt-12 pt-10 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Customer Reviews
            </h2>

            {stats && stats.totalReviews > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 mb-8">
                <div className="text-center">
                  <p className="text-5xl font-normal text-gray-900">
                    {parseFloat(String(stats.averageRating)).toFixed(1)}
                  </p>
                  <Stars
                    rating={parseFloat(String(stats.averageRating))}
                    size="lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalReviews} rating
                    {stats.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  <RatingBar
                    label="5 star"
                    count={stats.fiveStars}
                    total={stats.totalReviews}
                  />
                  <RatingBar
                    label="4 star"
                    count={stats.fourStars}
                    total={stats.totalReviews}
                  />
                  <RatingBar
                    label="3 star"
                    count={stats.threeStars}
                    total={stats.totalReviews}
                  />
                  <RatingBar
                    label="2 star"
                    count={stats.twoStars}
                    total={stats.totalReviews}
                  />
                  <RatingBar
                    label="1 star"
                    count={stats.oneStar}
                    total={stats.totalReviews}
                  />
                </div>
              </div>
            )}

            {/* Review form */}
            {canReview && user ? (
              <div className="bg-gray-50 p-5 rounded-lg mb-8 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Write a review
                </h3>
                <form onSubmit={submitReview} className="space-y-4">
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product…"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400] resize-y"
                  />
                  {reviewError && (
                    <p className="text-sm text-red-600">{reviewError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!reviewRating || reviewSubmitting}
                    className="bg-[#d35400] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b84700] transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              </div>
            ) : !user ? (
              <p className="text-sm text-gray-500 mb-6">
                <Link href="/login" className="text-[#d35400] hover:underline">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            ) : null}

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      {rev.profilePicture ? (
                        <img
                          src={rev.profilePicture}
                          alt={rev.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d35400] to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                          {(rev.userName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {rev.userName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Stars rating={rev.rating} />
                    {rev.reviewText && (
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                        {rev.reviewText}
                      </p>
                    )}
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

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { CATEGORY_GROUPS, ALL_CATEGORIES } from "@/lib/categories";
import type { Ad, BannerAd, Store } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Static fallback banners shown when no advertiser banners are loaded ────────
type StaticBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bg: string;
  accent: string;
  icon: string;
};

const STATIC_BANNERS: StaticBanner[] = [
  {
    id: "s1",
    title: "India's B2B Marketplace for Products & Services",
    subtitle:
      "From raw materials to finished goods — connect with verified buyers and sellers across every industry.",
    cta: "Browse Listings",
    href: "/listings",
    bg: "from-[#7c2d00] via-[#a33a00] to-[#d35400]",
    accent: "bg-amber-400 text-gray-900",
    icon: "🏭",
  },
  {
    id: "s2",
    title: "Grow Your Business. List for Free.",
    subtitle:
      "No subscription, no commission. Create your store and reach thousands of verified buyers today.",
    cta: "Start Selling Free",
    href: "/signup?role=seller",
    bg: "from-[#92400e] via-[#b45309] to-[#f59e0b]",
    accent: "bg-white text-[#92400e]",
    icon: "🚀",
  },
  {
    id: "s3",
    title: "Post a Buying Requirement. Get Quotes Fast.",
    subtitle:
      "Tell suppliers what you need — any product or service — and receive direct quotes with no middleman.",
    cta: "Post Requirement",
    href: "/dashboard",
    bg: "from-[#7f1d1d] via-[#b91c1c] to-[#ef4444]",
    accent: "bg-amber-300 text-gray-900",
    icon: "📋",
  },
  {
    id: "s4",
    title: "Trade with Confidence. Sellers are Verified.",
    subtitle:
      "Every seller on BigSpice goes through a verification process so you can buy and sell with peace of mind.",
    cta: "See All Suppliers",
    href: "/stores",
    bg: "from-[#431407] via-[#9a3412] to-[#ea580c]",
    accent: "bg-yellow-300 text-gray-900",
    icon: "✅",
  },
];

// ── Carousel ──────────────────────────────────────────────────────────────────
function HeroBannerCarousel({ banners }: { banners: BannerAd[] }) {
  // Always cycle through static slides + any loaded API banners together
  // This prevents the carousel from stopping when there is only 1 api banner
  const total = STATIC_BANNERS.length + banners.length;

  const [idx, setIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const prev = () => {
    setIdx((i) => (i - 1 + total) % total);
    resetTimer();
  };
  const next = () => {
    setIdx((i) => (i + 1) % total);
    resetTimer();
  };

  return (
    <div className="relative overflow-hidden h-48 sm:h-64 md:h-80">
      {/* Static slides */}
      {STATIC_BANNERS.map((b, i) => (
        <Link
          key={b.id}
          href={b.href}
          className={`absolute inset-0 bg-gradient-to-r ${b.bg} transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-full h-full flex flex-col items-start justify-center px-5 sm:px-16 md:px-24 gap-2 sm:gap-3">
            <span className="hidden sm:block text-4xl sm:text-5xl leading-none">
              {b.icon}
            </span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-snug max-w-lg">
              {b.title}
            </h2>
            <p className="text-white/80 text-[11px] sm:text-sm md:text-base max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
              {b.subtitle}
            </p>
            <span
              className={`inline-block text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg ${b.accent} mt-0.5 sm:mt-1`}
            >
              {b.cta} →
            </span>
          </div>
        </Link>
      ))}

      {/* API / advertiser banner slides (appended after static slides) */}
      {banners.map((b, i) => (
        <a
          key={b.id}
          href={b.targetUrl}
          className={`absolute inset-0 transition-opacity duration-700 ${
            STATIC_BANNERS.length + i === idx
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          } bg-gradient-to-r from-orange-900 to-orange-700`}
        >
          {b.imageUrl ? (
            <img
              src={b.imageUrl}
              alt={b.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-center px-5">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 leading-snug">
                {b.title}
              </h2>
              {b.description && (
                <p className="text-white/80 text-[11px] sm:text-base max-w-xl line-clamp-2 sm:line-clamp-none">
                  {b.description}
                </p>
              )}
            </div>
          )}
        </a>
      ))}

      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        aria-label="Previous"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        aria-label="Next"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIdx(i);
              resetTimer();
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === idx ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Hero Value-Prop strip (visible on all screen sizes) ───────────────────────
function HeroStrip() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 py-7 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-7 sm:gap-12">
          {/* Left: headline */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#d35400] mb-2">
              Where Buyers Meet Sellers
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
              Big Spice is India&apos;s fastest growing{" "}
              <span className="text-[#d35400]">B2B marketplace</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-lg leading-relaxed">
              Discover and connect with trusted buyers and sellers, negotiate
              directly, and close deals without any middleman.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href="/listings"
                className="bg-[#d35400] hover:bg-[#b84700] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Browse Products
              </Link>
              <Link
                href="/signup?role=seller"
                className="border-2 border-[#d35400] text-[#d35400] hover:bg-orange-50 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Start Selling Free
              </Link>
            </div>
          </div>

          {/* Divider (large screens only) */}
          <div className="hidden lg:block w-px h-36 bg-gray-200 shrink-0" />

          {/* Right: benefit tiles — 2×2 grid on all sizes */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto sm:shrink-0">
            {[
              {
                icon: "🎉",
                title: "Free to Join & List",
                desc: "No signup or listing fee",
              },
              {
                icon: "🤝",
                title: "Direct Connect",
                desc: "Buyer meets seller — no middleman",
              },
              {
                icon: "📈",
                title: "Unlimited Leads",
                desc: "Receive & respond to unlimited enquiries",
              },
              {
                icon: "📢",
                title: "Post Ads",
                desc: "Boost products with sponsored listings",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-2.5 bg-orange-50 rounded-xl p-3 border border-orange-100"
              >
                <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-snug">
                    {title}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Search results + filters (Amazon-style) ───────────────────────────────────
function SearchResults({
  results,
  query,
  allAds,
}: {
  results: Ad[];
  query: string;
  allAds: Ad[];
}) {
  const router = useRouter();
  const [filtered, setFiltered] = useState<Ad[]>(results);
  const [sort, setSort] = useState("popular");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMoq, setMaxMoq] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasPrice, setHasPrice] = useState(false);
  const [selCats, setSelCats] = useState<string[]>([]);

  // Derive unique categories and tags from current results
  const cats = Array.from(
    new Set(results.map((a) => a.category).filter(Boolean)),
  ) as string[];

  const applyFilters = useCallback(() => {
    let r = [...results];
    if (selCats.length)
      r = r.filter((a) => a.category && selCats.includes(a.category));
    if (minPrice)
      r = r.filter((a) => a.price != null && a.price >= parseFloat(minPrice));
    if (maxPrice)
      r = r.filter((a) => a.price != null && a.price <= parseFloat(maxPrice));
    if (maxMoq) r = r.filter((a) => (a.minOrder ?? 0) <= parseInt(maxMoq));
    if (minRating > 0) r = r.filter((a) => (a.averageRating ?? 0) >= minRating);
    if (inStock) r = r.filter((a) => a.stock != null && a.stock > 0);
    if (verified) r = r.filter((a) => a.verified);
    if (hasPrice) r = r.filter((a) => a.price != null);

    // Sort
    if (sort === "popular")
      r.sort(
        (a, b) =>
          (b.views ?? 0) - (a.views ?? 0) ||
          (b.averageRating ?? 0) - (a.averageRating ?? 0),
      );
    else if (sort === "price-low")
      r.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "price-high")
      r.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else if (sort === "newest")
      r.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (sort === "rating")
      r.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));

    setFiltered(r);
  }, [
    results,
    selCats,
    minPrice,
    maxPrice,
    maxMoq,
    minRating,
    inStock,
    verified,
    hasPrice,
    sort,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearAll = () => {
    setSelCats([]);
    setMinPrice("");
    setMaxPrice("");
    setMaxMoq("");
    setMinRating(0);
    setInStock(false);
    setVerified(false);
    setHasPrice(false);
    setSort("popular");
  };

  const toggleCat = (c: string) =>
    setSelCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
        <button
          onClick={() => router.push("/")}
          className="hover:text-[#d35400]"
        >
          Home
        </button>
        <span>›</span>
        <span>{query ? `Results for "${query}"` : "All listings"}</span>
      </div>

      {/* Results info bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600">
          <strong>{filtered.length}</strong> result
          {filtered.length !== 1 ? "s" : ""}
          {query && ` for "${query}"`}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sortSelect" className="text-gray-500">
            Sort by:
          </label>
          <select
            id="sortSelect"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d35400]"
          >
            <option value="popular">Most Popular</option>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden md:block w-56 shrink-0 space-y-5">
          <h3 className="font-bold text-gray-800">Filters</h3>

          {cats.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Category
              </h4>
              {cats.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-1"
                >
                  <input
                    type="checkbox"
                    checked={selCats.includes(c)}
                    onChange={() => toggleCat(c)}
                    className="accent-[#d35400]"
                  />
                  {c}
                </label>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Price Range
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Min. Order Qty
            </h4>
            <select
              value={maxMoq}
              onChange={(e) => setMaxMoq(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
            >
              <option value="">Any</option>
              <option value="10">Up to 10</option>
              <option value="50">Up to 50</option>
              <option value="100">Up to 100</option>
              <option value="500">Up to 500</option>
              <option value="1000">Up to 1,000</option>
            </select>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Min. Rating
            </h4>
            <div className="flex flex-wrap gap-1">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${minRating === r ? "bg-[#d35400] text-white border-[#d35400]" : "border-gray-300 text-gray-600 hover:border-[#d35400]"}`}
                >
                  {r === 0 ? "All" : `${r}+ ★`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-gray-500">
              Availability
            </h4>
            {[
              { label: "In Stock only", state: inStock, set: setInStock },
              { label: "✓ Verified only", state: verified, set: setVerified },
              { label: "Has price", state: hasPrice, set: setHasPrice },
            ].map(({ label, state, set }) => (
              <label
                key={label}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={state}
                  onChange={(e) => set(e.target.checked)}
                  className="accent-[#d35400]"
                />
                {label}
              </label>
            ))}
          </div>

          <button
            onClick={clearAll}
            className="text-xs text-[#d35400] hover:underline"
          >
            Clear all filters
          </button>
        </aside>

        {/* Results grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg
                className="mx-auto mb-4 text-gray-300"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No results found{query && ` for "${query}"`}
              </h3>
              <p className="text-sm">
                Try different keywords or clear filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((ad) => (
                <ProductCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Horizontal scroll row ─────────────────────────────────────────────────────
function HScrollRow<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    ref.current?.scrollBy({
      left: dir === "left" ? -250 : 250,
      behavior: "smooth",
    });

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow text-gray-600 hover:text-[#d35400] p-1.5 rounded-full -ml-3"
        aria-label="Scroll left"
      >
        &#8249;
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {items.map((item, i) => renderItem(item, i))}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow text-gray-600 hover:text-[#d35400] p-1.5 rounded-full -mr-3"
        aria-label="Scroll right"
      >
        &#8250;
      </button>
    </div>
  );
}

// ── Latest Requirements list ──────────────────────────────────────────────────
function RequirementCard({ ad }: { ad: Ad }) {
  return (
    <Link
      href={`/listing/${ad.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3">
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
            loading="lazy"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {ad.title}
          </h3>
          {ad.category && (
            <span className="text-[11px] text-[#d35400]">{ad.category}</span>
          )}
          {ad.tags && ad.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {ad.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            {ad.storeName || ad.author ? `by ${ad.storeName || ad.author}` : ""}
            {ad.createdAt
              ? ` · ${new Date(ad.createdAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Store card ────────────────────────────────────────────────────────────────
function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="w-44 shrink-0 block bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow"
    >
      {store.logo ? (
        <img
          src={store.logo}
          alt={store.storeName || store.name}
          className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-gray-100"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d35400] to-amber-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
          {(store.storeName || store.name || "S").charAt(0).toUpperCase()}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
        {store.storeName || store.name}
      </p>
      {store.categories && (
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {store.categories}
        </p>
      )}
    </Link>
  );
}

// ── Mobile Product Card (2-col grid, Flipkart/Amazon style) ──────────────────
function MobileProductCard({ ad }: { ad: Ad }) {
  return (
    <Link
      href={`/listing/${ad.id}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform"
    >
      <div
        className="relative bg-gray-50 overflow-hidden"
        style={{ aspectRatio: "1" }}
      >
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <svg
              width="36"
              height="36"
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
        {!!ad.verified && (
          <span className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
            ✓
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
          {ad.title}
        </p>
        {ad.price != null ? (
          <p className="text-sm font-bold text-[#d35400]">
            ₹{parseFloat(String(ad.price)).toFixed(0)}
            {ad.unit && (
              <span className="text-[10px] text-gray-400 font-normal ml-0.5">
                /{ad.unit}
              </span>
            )}
          </p>
        ) : (
          <p className="text-[10px] text-gray-400 italic">Price on request</p>
        )}
        {(ad.storeName || ad.author) && (
          <p className="text-[10px] text-gray-400 truncate mt-0.5">
            {ad.storeName || ad.author}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Mobile Supplier Card (product-style 2-col grid, matching MobileProductCard) ──
function MobileSupplierCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform"
    >
      <div
        className="relative bg-gray-50 overflow-hidden"
        style={{ aspectRatio: "1" }}
      >
        {store.logo ? (
          <img
            src={store.logo}
            alt={store.storeName || store.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#d35400] to-amber-400">
            <span className="text-white text-4xl font-bold">
              {(store.storeName || store.name || "S").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm">
          Supplier
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 line-clamp-1 leading-snug mb-1">
          {store.storeName || store.name}
        </p>
        {store.categories ? (
          <p className="text-[10px] text-[#d35400] truncate">
            {store.categories}
          </p>
        ) : store.businessType ? (
          <p className="text-[10px] text-[#d35400] truncate">
            {store.businessType}
          </p>
        ) : null}
        {store.tagline && (
          <p className="text-[10px] text-gray-400 truncate mt-0.5">
            {store.tagline}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Mobile Requirement Card (Buy Leads board, IndiaMART style) ────────────────
function MobileRequirementCard({ ad }: { ad: Ad }) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <Link
      href={`/listing/${ad.id}`}
      className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 active:bg-gray-50"
    >
      <div className="mt-2 w-2 h-2 rounded-full bg-[#d35400] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5">
          {ad.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {ad.category && (
            <span className="text-[10px] bg-orange-50 text-[#d35400] px-2 py-0.5 rounded-full font-medium border border-orange-100">
              {ad.category}
            </span>
          )}
          {ad.minOrder != null && (
            <span className="text-[10px] text-gray-500">
              Qty: {ad.minOrder}+
            </span>
          )}
          {(ad.storeName || ad.author) && (
            <span className="text-[10px] text-gray-400">
              by {ad.storeName || ad.author}
            </span>
          )}
          {ad.createdAt && (
            <span className="text-[10px] text-gray-400">
              {timeAgo(ad.createdAt)}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 self-center text-[11px] font-semibold text-[#d35400] border border-[#d35400] px-2.5 py-1 rounded-lg whitespace-nowrap">
        Respond →
      </span>
    </Link>
  );
}

// ── Main Home component ───────────────────────────────────────────────────────
export default function HomePage() {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Ad[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/banner-ads")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/ads")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/stores")
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([b, a, s]) => {
      setBanners(b as BannerAd[]);
      setAllAds(a as Ad[]);
      setStores(s as Store[]);
      setLoading(false);
    });
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const lower = q.toLowerCase().trim();
      const terms = lower.split(/\s+/);
      const filtered = allAds.filter((ad) => {
        const matches = (s: string) => s.toLowerCase().includes(lower);
        const multiWord = terms.every(
          (t) =>
            (ad.title || "").toLowerCase().includes(t) ||
            (ad.description || "").toLowerCase().includes(t) ||
            (ad.category || "").toLowerCase().includes(t) ||
            (ad.author || "").toLowerCase().includes(t) ||
            (ad.tags || []).some((tag) => tag.toLowerCase().includes(t)),
        );
        return (
          matches(ad.title || "") ||
          matches(ad.description || "") ||
          matches(ad.category || "") ||
          matches(ad.author || "") ||
          (ad.tags || []).some((tag) => matches(tag)) ||
          multiWord
        );
      });
      setSearchResults(filtered);
    },
    [allAds],
  );

  // Products (non-requirements sorted by views)
  const products = allAds
    .filter((a) => a.listingType !== "requirement")
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 20);
  // Requirements
  const requirements = allAds
    .filter(
      (a) => a.listingType === "requirement" || (!a.listingType && !a.price),
    )
    .slice(0, 12);

  return (
    <>
      <Navbar searchValue={searchQuery} onSearch={handleSearch} showSubNav />
      <CategoryNav />

      {isSearching ? (
        <main className="flex-1">
          <SearchResults
            results={searchResults}
            query={searchQuery}
            allAds={allAds}
          />
        </main>
      ) : (
        <main className="flex-1">
          {/* Hero carousel — always visible; static banners show until API banners load */}
          <HeroBannerCarousel banners={banners} />

          {/* Value-prop hero strip (visible on all screen sizes) */}
          <HeroStrip />

          {/* Mobile: Quick Category Browse (IndiaMART-style pill strip) */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide bg-white border-b border-gray-100 py-3">
            <div className="flex gap-2 px-4 w-max">
              {ALL_CATEGORIES.slice(0, 16).map((cat) => (
                <Link
                  key={cat}
                  href={`/listings?q=${encodeURIComponent(cat)}`}
                  className="text-xs whitespace-nowrap bg-orange-50 text-[#d35400] px-3 py-1.5 rounded-full font-medium border border-orange-100 active:bg-orange-100"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <section className="py-10 sm:py-14 bg-[#fdf8f5] border-b-8 border-gray-100">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  How It Works
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                  Hire trusted professionals in 3 simple steps
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-0">
                {/* Step 1 */}
                <div className="flex-1 bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-6 sm:p-8 text-center w-full">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 flex items-center justify-center text-[#d35400]">
                      <svg
                        className="w-9 h-9"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="12" y2="17" />
                      </svg>
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#d35400] text-white text-xs font-black flex items-center justify-center border-2 border-[#fdf8f5] shadow">
                      1
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    Post Your Requirement
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Tell us what service/product you need, your location, and
                    any details. It&apos;s free and takes less than a minute.
                  </p>
                </div>

                {/* Connector */}
                <div className="hidden sm:flex items-center flex-shrink-0 w-14 justify-center pb-10">
                  <svg
                    viewBox="0 0 60 20"
                    fill="none"
                    className="w-14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10 H52"
                      stroke="#e0a070"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M48 5 L58 10 L48 15"
                      stroke="#d35400"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex sm:hidden items-center justify-center w-8 h-8 my-1">
                  <svg
                    viewBox="0 0 20 40"
                    fill="none"
                    className="h-8"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 2 V32"
                      stroke="#e0a070"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 28 L10 38 L15 28"
                      stroke="#d35400"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="flex-1 bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-6 sm:p-8 text-center w-full">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 flex items-center justify-center text-[#d35400]">
                      <svg
                        className="w-9 h-9"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#d35400] text-white text-xs font-black flex items-center justify-center border-2 border-[#fdf8f5] shadow">
                      2
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    Sellers/Technicians Respond
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Qualified professionals see your request and reach out with
                    their offers, availability, and pricing.
                  </p>
                </div>

                {/* Connector */}
                <div className="hidden sm:flex items-center flex-shrink-0 w-14 justify-center pb-10">
                  <svg
                    viewBox="0 0 60 20"
                    fill="none"
                    className="w-14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10 H52"
                      stroke="#e0a070"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M48 5 L58 10 L48 15"
                      stroke="#d35400"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex sm:hidden items-center justify-center w-8 h-8 my-1">
                  <svg
                    viewBox="0 0 20 40"
                    fill="none"
                    className="h-8"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 2 V32"
                      stroke="#e0a070"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 28 L10 38 L15 28"
                      stroke="#d35400"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="flex-1 bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-6 sm:p-8 text-center w-full">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 flex items-center justify-center text-[#d35400]">
                      <svg
                        className="w-9 h-9"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#d35400] text-white text-xs font-black flex items-center justify-center border-2 border-[#fdf8f5] shadow">
                      3
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    Review Profile &amp; Choose
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Browse their store, read reviews, compare offerings, and
                    confidently hire the right professional for the job.
                  </p>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d35400] to-[#f39c12] text-white font-bold px-8 py-3.5 rounded-lg text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Post a Requirement — It&apos;s Free
                </Link>
              </div>
            </div>
          </section>

          {/* Popular Products */}
          <section className="py-5 sm:py-8 bg-white">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  🔥 Popular Products
                </h2>
                <Link
                  href="/listings"
                  className="text-sm text-[#d35400] hover:underline font-medium"
                >
                  See all →
                </Link>
              </div>
              {loading ? (
                <>
                  <div className="sm:hidden grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-gray-100 animate-pulse"
                        style={{ aspectRatio: "1" }}
                      />
                    ))}
                  </div>
                  <div className="hidden sm:flex gap-4 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-56 h-56 rounded-xl bg-gray-100 animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                </>
              ) : products.length > 0 ? (
                <>
                  {/* Mobile: 2-col compact grid (Flipkart/Amazon style) */}
                  <div className="sm:hidden">
                    <div className="grid grid-cols-2 gap-2.5">
                      {products.slice(0, 8).map((ad) => (
                        <MobileProductCard key={ad.id} ad={ad} />
                      ))}
                    </div>
                    {products.length > 8 && (
                      <Link
                        href="/listings"
                        className="block w-full text-center bg-orange-50 text-[#d35400] font-semibold text-sm py-3 rounded-xl border border-orange-200 mt-4"
                      >
                        View all products →
                      </Link>
                    )}
                  </div>
                  {/* Desktop: horizontal scroll */}
                  <div className="hidden sm:block">
                    <HScrollRow
                      items={products}
                      renderItem={(ad) => (
                        <ProductCard
                          key={ad.id}
                          ad={ad}
                          variant="horizontal-scroll"
                        />
                      )}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No products yet.</p>
              )}
            </div>
          </section>

          {/* Featured Sellers */}
          <section className="py-5 sm:py-8 bg-gray-50">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  🏪 Featured Sellers
                </h2>
                <Link
                  href="/stores"
                  className="text-sm text-[#d35400] hover:underline font-medium"
                >
                  See all →
                </Link>
              </div>
              {loading ? (
                <>
                  <div className="sm:hidden grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-gray-200 animate-pulse"
                        style={{ aspectRatio: "1" }}
                      />
                    ))}
                  </div>
                  <div className="hidden sm:flex gap-4 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-44 h-44 rounded-xl bg-gray-100 animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                </>
              ) : stores.length > 0 ? (
                <>
                  {/* Mobile: 2-col product-style grid */}
                  <div className="sm:hidden">
                    <div className="grid grid-cols-2 gap-2.5">
                      {stores.slice(0, 6).map((s) => (
                        <MobileSupplierCard key={s.id} store={s} />
                      ))}
                    </div>
                    {stores.length > 6 && (
                      <Link
                        href="/stores"
                        className="block w-full text-center bg-orange-50 text-[#d35400] font-semibold text-sm py-3 rounded-xl border border-orange-200 mt-4"
                      >
                        View all suppliers →
                      </Link>
                    )}
                  </div>
                  {/* Desktop: horizontal scroll */}
                  <div className="hidden sm:block">
                    <HScrollRow
                      items={stores}
                      renderItem={(s) => <StoreCard key={s.id} store={s} />}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No suppliers yet.</p>
              )}
            </div>
          </section>

          {/* Latest Requirements */}
          <section className="py-5 sm:py-8 bg-white">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  📋 Latest Requirements
                </h2>
                <Link
                  href="/listings"
                  className="text-sm text-[#d35400] hover:underline font-medium"
                >
                  View all →
                </Link>
              </div>
              {loading ? (
                <>
                  <div className="sm:hidden space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 rounded-xl bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 rounded-xl bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                </>
              ) : requirements.length > 0 ? (
                <>
                  {/* Mobile: Buy Leads board (IndiaMART style) */}
                  <div className="sm:hidden">
                    {/* Post Requirement CTA banner */}
                    <div className="bg-gradient-to-r from-[#d35400] to-amber-500 rounded-xl p-4 mb-3">
                      <p className="text-white text-sm font-bold mb-0.5">
                        Looking for a specific product?
                      </p>
                      <p className="text-orange-100 text-xs mb-3">
                        Post your requirement and get quotes from verified
                        suppliers.
                      </p>
                      <Link
                        href="/dashboard"
                        className="inline-block bg-white text-[#d35400] text-xs font-bold px-4 py-2 rounded-lg"
                      >
                        Post Requirement
                      </Link>
                    </div>
                    {/* Lead cards */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      {requirements.slice(0, 8).map((ad) => (
                        <MobileRequirementCard key={ad.id} ad={ad} />
                      ))}
                    </div>
                    {requirements.length > 8 && (
                      <Link
                        href="/listings"
                        className="block w-full text-center bg-orange-50 text-[#d35400] font-semibold text-sm py-3 rounded-xl border border-orange-200 mt-3"
                      >
                        View all requirements →
                      </Link>
                    )}
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {requirements.map((ad) => (
                      <RequirementCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-lg mb-1">No requirements posted yet</p>
                  <p className="text-sm">Be the first to post a requirement!</p>
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      <Footer />
    </>
  );
}

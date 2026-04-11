"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Ad } from "@/types";

function AllListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const q = searchParams.get("q") || "";

  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [filtered, setFiltered] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasPrice, setHasPrice] = useState(false);
  const [selCats, setSelCats] = useState<string[]>(category ? [category] : []);
  const [searchQuery, setSearchQuery] = useState(q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data: Ad[]) => {
        setAllAds(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sync URL params → local state
  useEffect(() => {
    setSelCats(category ? [category] : []);
    setSearchQuery(q);
  }, [category, q]);

  const applyFilters = useCallback(() => {
    let r = [...allAds];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase().trim();
      const terms = lower.split(/\s+/);
      r = r.filter((ad) =>
        terms.every(
          (t) =>
            (ad.title || "").toLowerCase().includes(t) ||
            (ad.description || "").toLowerCase().includes(t) ||
            (ad.category || "").toLowerCase().includes(t) ||
            (ad.author || "").toLowerCase().includes(t) ||
            (ad.storeName || "").toLowerCase().includes(t) ||
            (ad.tags || []).some((tag) => tag.toLowerCase().includes(t)),
        ),
      );
    }
    if (selCats.length)
      r = r.filter((a) => a.category && selCats.includes(a.category));
    if (minPrice)
      r = r.filter((a) => a.price != null && a.price >= parseFloat(minPrice));
    if (maxPrice)
      r = r.filter((a) => a.price != null && a.price <= parseFloat(maxPrice));
    if (minRating > 0) r = r.filter((a) => (a.averageRating ?? 0) >= minRating);
    if (inStock) r = r.filter((a) => a.stock != null && a.stock > 0);
    if (verifiedOnly) r = r.filter((a) => a.verified);
    if (hasPrice) r = r.filter((a) => a.price != null);

    if (sort === "popular") r.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    else if (sort === "newest")
      r.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (sort === "price-low")
      r.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "price-high")
      r.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else if (sort === "rating")
      r.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));

    setFiltered(r);
  }, [
    allAds,
    searchQuery,
    selCats,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    verifiedOnly,
    hasPrice,
    sort,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const cats = Array.from(
    new Set(allAds.map((a) => a.category).filter(Boolean)),
  ) as string[];

  const toggleCat = (c: string) =>
    setSelCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const clearAll = () => {
    setSelCats([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStock(false);
    setVerifiedOnly(false);
    setHasPrice(false);
    setSort("newest");
    router.replace("/listings");
  };

  const pageTitle = q
    ? `Results for "${q}"`
    : category
      ? category
      : "All Listings";

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#d35400]";

  const FilterPanel = () => (
    <aside className="w-full md:w-56 shrink-0 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Filters</h3>
        <button
          onClick={clearAll}
          className="text-xs text-[#d35400] hover:underline"
        >
          Clear all
        </button>
      </div>

      {cats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
            Category
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {cats.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
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
          {
            label: "✓ Verified only",
            state: verifiedOnly,
            set: setVerifiedOnly,
          },
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
    </aside>
  );

  return (
    <>
      <Navbar />
      <CategoryNav />
      <main className="flex-1">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          {/* Title row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-500">
                {loading
                  ? "Loading…"
                  : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="md:hidden flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-2 rounded-lg hover:border-[#d35400] text-gray-600"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="20" y2="12" />
                  <line x1="12" y1="18" x2="20" y2="18" />
                </svg>
                Filters
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d35400]"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Best Rated</option>
              </select>
            </div>
          </div>

          {/* Mobile filters drawer */}
          {mobileFiltersOpen && (
            <div className="md:hidden bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow">
              <FilterPanel />
            </div>
          )}

          <div className="flex gap-6">
            {/* Desktop filters */}
            <div className="hidden md:block">
              <FilterPanel />
            </div>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 rounded-xl bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <svg
                    className="mx-auto mb-3 text-gray-300"
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <h3 className="font-semibold text-gray-700 mb-1">
                    No listings found
                  </h3>
                  <p className="text-sm">
                    Check spelling or try clearing filters.
                  </p>
                  <button
                    onClick={clearAll}
                    className="mt-4 text-xs text-[#d35400] hover:underline"
                  >
                    Clear all filters
                  </button>
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
      </main>
      <Footer />
    </>
  );
}

export default function AllListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <AllListingsContent />
    </Suspense>
  );
}

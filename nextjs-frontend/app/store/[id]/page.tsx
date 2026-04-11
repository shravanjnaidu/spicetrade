"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getUser } from "@/lib/auth";
import type { Store, Ad, User } from "@/types";

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const storeId = parseInt(id, 10);

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!storeId) return;
    // Increment view
    fetch(`/api/stores/${storeId}/view`, { method: "POST" }).catch(() => {});

    Promise.all([
      fetch("/api/stores")
        .then((r) => r.json())
        .then((stores: Store[]) => stores.find((s) => s.id === storeId) || null)
        .catch(() => null),
      fetch("/api/ads")
        .then((r) => r.json())
        .then((ads: Ad[]) => ads.filter((a) => a.userId === storeId))
        .catch(() => []),
    ]).then(([storeData, ads]) => {
      setStore(storeData);
      setProducts(ads as Ad[]);
      setLoading(false);
    });
  }, [storeId]);

  const handleContact = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id === storeId) return;
    setContacting(true);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: user.id, sellerId: storeId }),
      });
      const j = await r.json();
      if (j.success) router.push("/messages");
    } catch {
      alert("Failed to start conversation. Please try again.");
    }
    setContacting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading store…
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-gray-700">Store not found</h2>
        <Link href="/stores" className="text-[#d35400] hover:underline text-sm">
          ← All Stores
        </Link>
      </div>
    );
  }

  const productListings = products.filter(
    (p) => p.listingType !== "service" && p.listingType !== "requirement",
  );
  const serviceListings = products.filter((p) => p.listingType === "service");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Store banner */}
        <div
          className="px-8 py-14 text-white"
          style={{
            background: "linear-gradient(135deg, #d35400 0%, #f39c12 100%)",
          }}
        >
          <div className="max-w-screen-lg mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-7">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.storeName || store.name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white/30 bg-white shrink-0"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-white/20 border-4 border-white/30 flex items-center justify-center text-5xl font-bold shrink-0">
                {(store.storeName || store.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {store.storeName || store.name}
              </h1>
              {store.categories && (
                <p className="opacity-95">{store.categories}</p>
              )}
              {store.address && (
                <p className="opacity-80 text-sm mt-1">{store.address}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {store.businessType && (
                  <span className="text-sm font-semibold px-4 py-1.5 rounded-full bg-white/20">
                    {store.businessType}
                  </span>
                )}
                {store.uniqueId && (
                  <span className="text-sm font-semibold px-4 py-1.5 rounded-full bg-white/20">
                    ID: {store.uniqueId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-screen-lg mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Main: products */}
            <div className="space-y-6">
              {productListings.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Products
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {productListings.map((p) => (
                      <ProductCard key={p.id} ad={p} />
                    ))}
                  </div>
                </div>
              )}
              {serviceListings.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Services
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {serviceListings.map((s) => (
                      <ProductCard key={s.id} ad={s} />
                    ))}
                  </div>
                </div>
              )}
              {productListings.length === 0 && serviceListings.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10">
                  No listings yet.
                </p>
              )}
            </div>

            {/* Sidebar: store info */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Store Info
                </h2>
                <div className="divide-y divide-gray-100 text-sm">
                  {[
                    { label: "Business Type", value: store.businessType },
                    { label: "Email", value: store.email },
                    { label: "Phone", value: store.phone },
                    {
                      label: "Location",
                      value: store.location || store.address,
                    },
                    {
                      label: "Member Since",
                      value: store.createdAt
                        ? new Date(store.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" },
                          )
                        : null,
                    },
                  ]
                    .filter((r) => r.value)
                    .map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2.5">
                        <span className="font-semibold text-gray-500">
                          {label}
                        </span>
                        <span className="text-gray-900 text-right truncate ml-2 max-w-[150px]">
                          {value}
                        </span>
                      </div>
                    ))}
                  {store.website && (
                    <div className="flex justify-between py-2.5">
                      <span className="font-semibold text-gray-500">
                        Website
                      </span>
                      <a
                        href={store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate ml-2 max-w-[150px]"
                      >
                        {store.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {user?.id !== storeId && (
                <button
                  onClick={handleContact}
                  disabled={contacting}
                  className="w-full bg-[#d35400] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-50"
                >
                  {contacting ? "Starting chat…" : "Contact Seller"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

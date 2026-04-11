"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Store } from "@/types";

function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all flex flex-col items-center text-center gap-3"
    >
      {store.logo ? (
        <img
          src={store.logo}
          alt={store.storeName || store.name}
          className="w-20 h-20 rounded-xl object-cover border border-gray-200"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#d35400] to-amber-400 flex items-center justify-center text-white text-3xl font-bold">
          {(store.storeName || store.name || "S").charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h3 className="font-bold text-gray-900 text-sm">
          {store.storeName || store.name || "Store"}
        </h3>
        <p className="text-xs text-[#d35400] mt-0.5">
          {store.categories || store.businessType || "General"}
        </p>
        {store.address && (
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {store.address.length > 40
              ? store.address.substring(0, 40) + "…"
              : store.address}
          </p>
        )}
        <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {store.businessType || "Seller"}
        </span>
      </div>
    </Link>
  );
}

export default function StoresListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        setStores(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              All Stores
            </h2>
            <p className="text-gray-500 text-sm">
              Browse all registered sellers on BigSpice
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <p className="text-center text-gray-400 py-16">
              No stores yet. Be the first to create one!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

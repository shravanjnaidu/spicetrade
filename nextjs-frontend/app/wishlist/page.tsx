"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import type { WishlistItem } from "@/types";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUserId(u.id);
    loadWishlist(u.id);
  }, [router]);

  async function loadWishlist(uid: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlist/${uid}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(wishlistId: number) {
    if (!confirm("Remove this item from your wishlist?")) return;
    try {
      const res = await fetch(`/api/wishlist/${wishlistId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (userId) loadWishlist(userId);
      } else {
        alert("Failed to remove item from wishlist");
      }
    } catch {
      alert("Failed to remove item from wishlist");
    }
  }

  const count = items.length;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-1 text-base">
            {loading
              ? "Loading..."
              : count === 0
                ? "No items yet"
                : `${count} item${count !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Start adding products you love to your wishlist!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-[#d35400] text-white rounded-lg font-semibold hover:bg-[#b84800] transition-colors text-sm"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <WishlistCard
                key={item.wishlistId}
                item={item}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (id: number) => void;
}) {
  const imgSrc = item.imageUrl || "";
  const placeholder =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' font-size='48' text-anchor='middle' dy='.3em'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all relative group">
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(item.wishlistId);
        }}
        className="absolute top-2 right-2 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-lg hover:scale-110 transition-transform"
        title="Remove from wishlist"
      >
        ❌
      </button>

      <Link href={`/listing/${item.id}`} className="block">
        <img
          src={imgSrc || placeholder}
          alt={item.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholder;
          }}
          className="w-full h-48 object-cover bg-gray-100"
          loading="lazy"
        />
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
            {item.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {item.description}
          </p>
          {item.price && (
            <div className="text-lg font-bold text-[#d35400] mb-1">
              ₹{parseFloat(String(item.price)).toFixed(2)}
              {item.unit ? `/${item.unit}` : ""}
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {item.storeName || item.author || "Seller"}
            </span>
            <span className="text-xs text-gray-400">
              {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : ""}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

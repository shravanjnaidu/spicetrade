import Link from "next/link";
import type { Ad } from "@/types";

interface ProductCardProps {
  ad: Ad;
  variant?: "grid" | "horizontal-scroll";
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-[#ffa41c]">
        {"★".repeat(full)}
        {half ? "½" : ""}
        {"☆".repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span className="text-gray-500">({count})</span>
    </div>
  );
}

export default function ProductCard({
  ad,
  variant = "grid",
}: ProductCardProps) {
  const isScroll = variant === "horizontal-scroll";

  return (
    <Link
      href={`/listing/${ad.id}`}
      className={[
        "block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
        isScroll ? "w-56 shrink-0" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              width="48"
              height="48"
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
        {ad.verified ? (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            ✓ Verified
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {ad.title}
        </h3>

        {(ad.reviewCount ?? 0) > 0 && (
          <StarRating
            rating={ad.averageRating ?? 0}
            count={ad.reviewCount ?? 0}
          />
        )}

        {ad.price != null ? (
          <p className="text-base font-semibold text-[#d35400]">
            ₹{parseFloat(String(ad.price)).toFixed(2)}
            {ad.unit && (
              <span className="text-xs text-gray-400 font-normal ml-1">
                /{ad.unit}
              </span>
            )}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Price on request</p>
        )}

        {ad.category && (
          <span className="inline-block text-[11px] bg-orange-50 text-[#d35400] px-2 py-0.5 rounded-full border border-orange-100">
            {ad.category}
          </span>
        )}

        {ad.storeName || ad.author ? (
          <p className="text-[11px] text-gray-400 truncate">
            by {ad.storeName || ad.author}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

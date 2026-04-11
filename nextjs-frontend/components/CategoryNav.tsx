"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { CATEGORY_GROUPS, ALL_CATEGORIES } from "@/lib/categories";

export default function CategoryNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-cat-dropdown]")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  return (
    <nav className="bg-[#f5f0eb] border-b border-orange-200">
      <div className="max-w-screen-xl mx-auto px-3 h-10 flex items-center gap-2">
        {/* "☰ All" button with mega-dropdown */}
        <div className="relative shrink-0" data-cat-dropdown>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#7a3000] hover:text-[#d35400] px-2 py-1 rounded transition-colors"
            aria-expanded={dropdownOpen}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            All
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-[600px] max-w-[92vw] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CATEGORY_GROUPS.map((grp) => (
                <div key={grp.label}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#d35400] mb-2">
                    {grp.label}
                  </h4>
                  <ul className="space-y-1">
                    {grp.items.map((cat) => (
                      <li key={cat}>
                        <Link
                          href={`/listings?category=${encodeURIComponent(cat)}`}
                          className="text-sm text-gray-600 hover:text-[#d35400] hover:underline block"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable category pills */}
        <div className="relative flex-1 flex items-center min-w-0">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 bg-[#f5f0eb]/90 text-[#7a3000] hover:text-[#d35400] p-1 rounded-full shadow-sm"
            aria-label="Scroll left"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-6 py-1"
          >
            {ALL_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/listings?category=${encodeURIComponent(cat)}`}
                className="shrink-0 text-xs text-[#7a3000] font-medium hover:text-[#d35400] whitespace-nowrap px-3 py-1 rounded-full border border-transparent hover:border-orange-300 hover:bg-orange-100 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 z-10 bg-[#f5f0eb]/90 text-[#7a3000] hover:text-[#d35400] p-1 rounded-full shadow-sm"
            aria-label="Scroll right"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

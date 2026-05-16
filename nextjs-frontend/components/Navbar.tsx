"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { getUser, clearUser, dashboardRoute } from "@/lib/auth";
import { ALL_CATEGORIES } from "@/lib/categories";
import type { User } from "@/types";

interface NavbarProps {
  searchValue?: string;
  onSearch?: (q: string) => void;
  showSubNav?: boolean;
}

export default function Navbar({ searchValue, onSearch }: NavbarProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState(searchValue ?? "");
  const [searchCat, setSearchCat] = useState("All Categories");
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSugs, setShowSugs] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Hydrate user from localStorage on mount
  useEffect(() => {
    setUser(getUser());
  }, []);

  // Sync controlled search value
  useEffect(() => {
    if (searchValue !== undefined) setQuery(searchValue);
  }, [searchValue]);

  // Poll unread messages for logged-in users
  useEffect(() => {
    if (!user?.id) return;
    const check = async () => {
      try {
        const res = await fetch(`/api/messages/unread/${user.id}`);
        const j = await res.json();
        setUnreadCount(j.unreadCount || 0);
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [user?.id]);

  // Update suggestions as user types
  useEffect(() => {
    if (!query.trim()) {
      try {
        const recent: string[] = JSON.parse(
          localStorage.getItem("recentSearches") || "[]",
        );
        setSuggestions(recent.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
      return;
    }
    const q = query.toLowerCase();
    const matches = ALL_CATEGORIES.filter((c) =>
      c.toLowerCase().includes(q),
    ).slice(0, 7);
    setSuggestions(matches);
  }, [query]);

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node))
        setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = useCallback(() => {
    clearUser();
    setUser(null);
    setDrawerOpen(false);
    setAccountOpen(false);
    router.push("/");
  }, [router]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setShowSugs(false);
      if (query.trim()) {
        try {
          const recent: string[] = JSON.parse(
            localStorage.getItem("recentSearches") || "[]",
          );
          const updated = [
            query.trim(),
            ...recent.filter((r) => r !== query.trim()),
          ].slice(0, 8);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
        } catch {
          /* ignore */
        }
      }
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (searchCat !== "All Categories") params.set("category", searchCat);
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/listings?${params.toString()}`);
      }
    },
    [query, searchCat, onSearch, router],
  );

  const selectSuggestion = useCallback(
    (s: string) => {
      setQuery(s);
      setShowSugs(false);
      try {
        const recent: string[] = JSON.parse(
          localStorage.getItem("recentSearches") || "[]",
        );
        const updated = [s, ...recent.filter((r) => r !== s)].slice(0, 8);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      const params = new URLSearchParams();
      params.set("q", s);
      if (searchCat !== "All Categories") params.set("category", searchCat);
      router.push(`/listings?${params.toString()}`);
    },
    [searchCat, router],
  );

  const dashRoute = dashboardRoute(user?.role);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <>
      {/* ── Utility strip (desktop only) ── */}
      <div className="hidden sm:block bg-[#1c1c1c] text-gray-400 text-xs">
        <div className="max-w-screen-xl mx-auto px-4 h-8 flex items-center justify-between">
          <span className="text-gray-500">
            India&apos;s leading B2B marketplace
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/signup?role=seller"
              className="hover:text-white transition-colors"
            >
              Become a Seller
            </Link>
            <span className="text-gray-700">|</span>
            <Link
              href="/signup?role=buyer"
              className="hover:text-white transition-colors"
            >
              Become a Buyer
            </Link>
            <span className="text-gray-700">|</span>
            <Link href="/faq" className="hover:text-white transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <header className="bg-[#d35400] sticky top-0 z-50 shadow-md">
        {/* ════ DESKTOP ROW ════ */}
        <div className="hidden sm:flex max-w-screen-xl mx-auto px-4 h-16 items-center gap-4">
          {/* Logo on white pill */}
          <Link
            href="/"
            className="shrink-0 bg-white rounded-lg px-2.5 py-1.5 hover:bg-orange-50 transition-colors"
          >
            <img
              src="/logos/bigspicelogo.png"
              alt="BigSpice"
              className="h-8 w-auto"
            />
          </Link>

          {/* Search bar with category prefix (Alibaba-style) */}
          <div className="flex-1 max-w-2xl relative">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white rounded-lg overflow-hidden ring-2 ring-white/30 focus-within:ring-white transition-all"
            >
              <select
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                className="shrink-0 h-11 px-2 text-sm text-gray-700 bg-gray-100 border-r border-gray-200 cursor-pointer focus:outline-none max-w-[140px]"
                aria-label="Category filter"
              >
                <option>All Categories</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSugs(true)}
                onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                type="search"
                placeholder="Search products, suppliers, categories..."
                className="flex-1 h-11 px-3 text-sm text-gray-900 focus:outline-none bg-white"
                autoComplete="off"
              />
              <button
                type="submit"
                className="shrink-0 h-11 px-5 bg-[#d35400] hover:bg-[#b84700] text-white font-semibold text-sm transition-colors flex items-center gap-1.5"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </button>
            </form>
            {/* Suggestions dropdown */}
            {showSugs && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[200] overflow-hidden">
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  {query.trim() ? "Suggested categories" : "Recent searches"}
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => selectSuggestion(s)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors text-left"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-gray-400"
                    >
                      {query.trim() ? (
                        <>
                          <circle cx="11" cy="11" r="7" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </>
                      ) : (
                        <>
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 7 12 12 15 15" />
                        </>
                      )}
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right action icons */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {/* Messages */}
            <Link
              href="/messages"
              className="relative flex flex-col items-center px-2.5 py-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors group"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[10px] mt-0.5 leading-none">Messages</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-yellow-400 text-[#7a3000] text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex flex-col items-center px-2.5 py-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="text-[10px] mt-0.5 leading-none">Wishlist</span>
            </Link>

            {/* Account dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-haspopup="true"
                aria-expanded={accountOpen}
              >
                {user ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {initials || "?"}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-[10px] text-white/70 leading-none">
                        Hello,
                      </p>
                      <p className="text-xs font-semibold truncate max-w-[80px] leading-tight">
                        {user.name.split(" ")[0]}
                      </p>
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <div className="text-left hidden lg:block">
                      <p className="text-[10px] text-white/70 leading-none">
                        Welcome
                      </p>
                      <p className="text-xs font-semibold leading-tight">
                        Account
                      </p>
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 w-56 py-2 overflow-hidden">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <span className="mt-1.5 inline-block text-[10px] bg-orange-100 text-[#d35400] px-2 py-0.5 rounded-full capitalize font-semibold">
                          {user.role}
                        </span>
                      </div>
                      {[
                        {
                          href: dashRoute,
                          label: "Dashboard",
                          icon: (
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                          ),
                        },
                        {
                          href: "/profile",
                          label: "My Profile",
                          icon: (
                            <>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </>
                          ),
                        },
                        {
                          href: "/messages",
                          label: "Messages",
                          icon: (
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          ),
                          badge: unreadCount,
                        },
                      ].map(({ href, label, icon, badge }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {icon}
                          </svg>
                          {label}
                          {badge ? (
                            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                      {user.role === "seller" && (
                        <Link
                          href={`/store/${user.id}`}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          My Store
                        </Link>
                      )}
                      <Link
                        href="/wishlist"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        Wishlist
                      </Link>
                      {(user.role === "seller" || user.role === "buyer") && (
                        <Link
                          href="/dashboard"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="7" y1="8" x2="17" y2="8" />
                            <line x1="7" y1="12" x2="17" y2="12" />
                            <line x1="7" y1="16" x2="13" y2="16" />
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                          </svg>
                          Post Requirement
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Sign in for a personalised experience
                        </p>
                        <Link
                          href="/login"
                          onClick={() => setAccountOpen(false)}
                          className="block w-full text-center bg-[#d35400] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors mb-2"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setAccountOpen(false)}
                          className="block w-full text-center border border-[#d35400] text-[#d35400] py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-50 transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 px-4 py-3">
                        <Link
                          href="/signup?role=seller"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#d35400] transition-colors"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          Become a Seller
                        </Link>
                        <Link
                          href="/signup?role=buyer"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#d35400] transition-colors"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          Become a Buyer
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Post Requirement CTA — visible to all; sellers can post sourcing requirements too */}
            <Link
              href={user ? "/dashboard" : "/login"}
              className="hidden lg:flex items-center gap-1.5 ml-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Post Requirement
            </Link>
          </div>
        </div>

        {/* ════ MOBILE ROW ════ */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-2">
          {/* Logo */}
          <Link href="/" className="shrink-0 bg-white rounded-md px-1.5 py-1">
            <img
              src="/logos/bigspicelogo.png"
              alt="BigSpice"
              className="h-7 w-auto"
            />
          </Link>

          {/* Search bar — grows to fill space */}
          <div className="flex-1 relative">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSugs(true)}
                onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                type="search"
                placeholder="Search..."
                className="flex-1 h-9 px-3 text-sm text-gray-900 focus:outline-none bg-transparent min-w-0"
                autoComplete="off"
              />
              <button
                type="submit"
                className="h-9 px-3 bg-[#b84700] text-white flex items-center justify-center shrink-0"
                aria-label="Search"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
            {/* Mobile suggestions dropdown */}
            {showSugs && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[200] overflow-hidden max-h-52 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  {query.trim() ? "Suggestions" : "Recent"}
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => selectSuggestion(s)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#d35400] transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-gray-400"
                    >
                      {query.trim() ? (
                        <>
                          <circle cx="11" cy="11" r="7" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </>
                      ) : (
                        <>
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 7 12 12 15 15" />
                        </>
                      )}
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Link href="/messages" className="relative p-2 text-white">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-[#7a3000] text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </Link>
            {user ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 rounded-full bg-white/20 border border-white/40 text-white text-xs font-bold flex items-center justify-center"
              >
                {initials || "?"}
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 text-white"
                aria-label="Open menu"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ════ MOBILE DRAWER ════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Slide-in panel */}
          <aside className="sm:hidden fixed top-0 left-0 h-full w-[min(80vw,300px)] bg-white z-50 shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="bg-[#d35400] px-4 py-5 flex items-center justify-between shrink-0">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/40 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {initials || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user.name}
                    </p>
                    <p className="text-white/70 text-xs capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-white font-semibold">Welcome!</p>
                  <p className="text-white/70 text-xs">
                    Sign in for full access
                  </p>
                </div>
              )}
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-white/80 hover:text-white p-1 ml-2 shrink-0"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              {/* Auth CTA for guests */}
              {!user && (
                <div className="px-4 py-4 flex gap-2 border-b border-gray-100">
                  <Link
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 text-center bg-[#d35400] text-white py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 text-center border border-[#d35400] text-[#d35400] py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* User-specific links */}
              {user && (
                <div className="border-b border-gray-100">
                  <Link
                    href={dashRoute}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Wishlist
                  </Link>
                  {(user.role === "seller" || user.role === "buyer") && (
                    <Link
                      href="/dashboard"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="13" y2="16" />
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                      Post Requirement
                    </Link>
                  )}
                  {user.role === "seller" && (
                    <Link
                      href={`/store/${user.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      My Store
                    </Link>
                  )}
                </div>
              )}

              {/* Browse */}
              <div className="border-b border-gray-100">
                <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Browse
                </p>
                <Link
                  href="/listings"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  All Listings
                </Link>
                <Link
                  href="/stores"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  All Suppliers
                </Link>
                <Link
                  href="/signup?role=seller"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Sell on BigSpice
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 active:bg-orange-100"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Help Center
                </Link>
              </div>

              {/* Sign out */}
              {user && (
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { setUser, getUser, dashboardRoute } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
  useEffect(() => {
    const u = getUser();
    if (u) router.replace(dashboardRoute(u.role));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (j?.success) {
        // Normalise id field
        if (j.userId && !j.id) j.id = j.userId;
        setUser(j);
        router.push(dashboardRoute(j.role));
      } else {
        setError(j?.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#d35400] hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d35400] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-[#d35400] hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    setTokenValid(!!token);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json();
      if (j.success) {
        setStatus("success");
        setMessage("Password updated! Redirecting to sign in…");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setStatus("error");
        setMessage(
          j.error || "Something went wrong. Please request a new reset link.",
        );
        if (
          j.error &&
          (j.error.includes("expired") || j.error.includes("Invalid"))
        ) {
          setTokenValid(false);
        }
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (tokenValid === false) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center space-y-4">
        <p className="text-red-600 font-medium">
          ⚠ This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block bg-[#d35400] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === "success" ? (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-lg text-sm mb-6">
          {message}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {message}
        </div>
      ) : null}

      {status !== "success" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100"
            />
            <p className="text-xs text-gray-400 mt-1">At least 8 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#d35400] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Updating…" : "Update password"}
          </button>
        </form>
      )}

      <p className="text-center text-sm mt-5">
        <Link href="/login" className="text-[#d35400] hover:underline">
          ← Back to Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set a new password
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Choose a strong password for your BigSpice account.
          </p>

          <Suspense
            fallback={<div className="text-sm text-gray-400">Loading…</div>}
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json();
      if (j.success) {
        setStatus("success");
        setMessage(
          j.message ||
            "If that email is registered, a reset link has been sent. Please check your inbox.",
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(j.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter your registered email address and we&apos;ll send you a link
            to reset your password.
          </p>

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

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#d35400] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            <Link href="/login" className="text-[#d35400] hover:underline">
              ← Back to Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

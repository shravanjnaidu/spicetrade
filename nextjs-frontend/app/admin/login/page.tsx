"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("admin_auth") === "true"
    ) {
      router.replace("/admin");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      sessionStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Invalid username or password");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm transition-transform ${shaking ? "animate-[shake_0.5s]" : ""}`}
        style={shaking ? { animation: "shake 0.5s" } : {}}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/logos/bigspicelogo.png"
            alt="BigSpice"
            className="h-12 mx-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <span
            className="inline-block text-white text-xs font-bold uppercase px-4 py-1.5 rounded-full mb-3"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Admin Access
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Login</h1>
          <p className="text-sm text-gray-500">
            Enter your credentials to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter username"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#d35400] transition-colors"
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
              placeholder="Enter password"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#d35400] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#d35400] text-white py-3.5 rounded-lg text-base font-semibold hover:bg-[#b84700] hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#d35400] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { setUser, dashboardRoute, getUser } from "@/lib/auth";
import { CATEGORY_GROUPS } from "@/lib/categories";

type Role = "seller" | "buyer" | "advertiser";

const SELLER_CATEGORY_GROUPS = CATEGORY_GROUPS.filter(
  (group) => group.label !== "Other" || group.items.length,
);

const ROLE_CONFIGS: Record<
  Role,
  { title: string; subtitle: string; btnText: string }
> = {
  seller: {
    title: "Create your seller account",
    subtitle: "Reach buyers, manage listings and grow your store.",
    btnText: "Create seller account",
  },
  buyer: {
    title: "Create your buyer account",
    subtitle: "Find products, connect with sellers and grow your business.",
    btnText: "Create buyer account",
  },
  advertiser: {
    title: "Create your advertiser account",
    subtitle:
      "Promote your brand, events and expos on the BigSpice homepage carousel.",
    btnText: "Create advertiser account",
  },
};

// Password complexity checks (same rules as original app.js)
function checkPassword(pwd: string) {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
}

const ROLE_CARDS: {
  role: Role;
  icon: React.ReactNode;
  heading: string;
  desc: string;
  color: string;
}[] = [
  {
    role: "seller",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    heading: "I want to Sell",
    desc: "List products & services, manage your store and reach thousands of buyers across India.",
    color: "text-[#d35400]",
  },
  {
    role: "buyer",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    heading: "I want to Buy",
    desc: "Discover verified suppliers, request quotes and source products from across the country.",
    color: "text-blue-600",
  },
  {
    role: "advertiser",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    heading: "I want to Advertise",
    desc: "Promote your brand, expos and events to thousands of B2B buyers and sellers.",
    color: "text-purple-600",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as Role | null;
  const [step, setStep] = useState<"pick" | "form">(
    initialRole ? "form" : "pick",
  );
  const [role, setRole] = useState<Role>(initialRole || "buyer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // password strength
  const [password, setPassword] = useState("");
  const pwdChecks = checkPassword(password);

  // Already logged in → go to dashboard
  useEffect(() => {
    const u = getUser();
    if (u) router.replace(dashboardRoute(u.role));
  }, [router]);

  const config = ROLE_CONFIGS[role];

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");

      const form = e.currentTarget;
      const fd = new FormData(form);
      const pwd = fd.get("password") as string;
      const cpwd = fd.get("confirmPassword") as string;

      // Password validation
      if (pwd !== cpwd) {
        setError("Passwords do not match.");
        return;
      }
      if (pwd.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!/[A-Z]/.test(pwd)) {
        setError("Password must contain at least one uppercase letter.");
        return;
      }
      if (!/[a-z]/.test(pwd)) {
        setError("Password must contain at least one lowercase letter.");
        return;
      }
      if (!/[^A-Za-z0-9]/.test(pwd)) {
        setError("Password must contain at least one special character.");
        return;
      }

      // Remove confirmPassword before sending
      fd.delete("confirmPassword");

      setLoading(true);
      try {
        const res = await fetch("/api/signup", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
          if (data.userId && !data.id) data.id = data.userId;
          setUser(data);
          router.push(dashboardRoute(data.role));
        } else {
          setError(data.error || "Signup failed");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#d35400] focus:ring-2 focus:ring-orange-100";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  if (step === "pick") {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <div className="max-w-3xl w-full">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Join India&apos;s leading B2B marketplace
            </h1>
            <p className="text-center text-gray-500 mb-10">
              How are you planning to use BigSpice?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ROLE_CARDS.map(({ role: r, icon, heading, desc, color }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setStep("form");
                  }}
                  className="group bg-white border-2 border-gray-200 hover:border-[#d35400] rounded-2xl p-8 flex flex-col items-center text-center gap-4 transition-all shadow-sm hover:shadow-md"
                >
                  <span
                    className={`${color} group-hover:scale-110 transition-transform`}
                  >
                    {icon}
                  </span>
                  <div>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {heading}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#d35400]">
                    Get started{" "}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#d35400] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back to role picker */}
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Role tabs */}
          <div className="flex gap-0 mb-8 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {(["seller", "buyer", "advertiser"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  "flex-1 py-3 text-sm font-semibold capitalize transition-colors",
                  role === r
                    ? "bg-[#d35400] text-white"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {config.title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {config.subtitle}&nbsp;&nbsp;
            <Link href="/login" className="text-[#d35400] hover:underline">
              Sign in instead
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >
            {/* Hidden role input */}
            <input type="hidden" name="role" value={role} />

            {/* ── Account details ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
                Account details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Your full name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact number</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                  <ul className="pwd-requirements mt-2">
                    <li className={pwdChecks.length ? "req-met" : ""}>
                      At least 8 characters
                    </li>
                    <li className={pwdChecks.upper ? "req-met" : ""}>
                      One uppercase letter (A–Z)
                    </li>
                    <li className={pwdChecks.lower ? "req-met" : ""}>
                      One lowercase letter (a–z)
                    </li>
                    <li className={pwdChecks.special ? "req-met" : ""}>
                      One special character (!@#$%…)
                    </li>
                  </ul>
                </div>
                <div>
                  <label className={labelCls}>Confirm password *</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Buyer-only fields */}
              {role === "buyer" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Location *</label>
                    <input
                      name="location"
                      type="text"
                      required
                      placeholder="e.g., Mumbai, India"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Profile Picture{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      name="profilePicture"
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#d35400] hover:file:bg-orange-100"
                    />
                  </div>
                </div>
              )}

              {/* Advertiser-only fields */}
              {role === "advertiser" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Company / Organization Name *
                    </label>
                    <input
                      name="advertiserCompany"
                      type="text"
                      required
                      placeholder="e.g., ABC Events Pvt Ltd"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Company Website{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      name="website"
                      type="text"
                      placeholder="yourcompany.com"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Seller-only sections ── */}
            {role === "seller" && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
                    Store details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Store / Business name</label>
                      <input
                        name="storeName"
                        type="text"
                        placeholder="e.g. Sunny Spices Pvt Ltd"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Business type</label>
                      <select name="businessType" className={inputCls}>
                        <option>Manufacturer</option>
                        <option>Wholesaler</option>
                        <option>Retailer</option>
                        <option>Service Provider</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Primary product category
                      </label>
                      <select name="categories" className={inputCls}>
                        <option value="">Select category</option>
                        {SELLER_CATEGORY_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.items.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        GST / VAT / Tax number{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input name="taxNumber" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
                    Business information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Business address</label>
                      <input name="address" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        Website{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input name="website" type="text" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
                    Store media &amp; shipping
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        Store logo{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        name="logo"
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#d35400] hover:file:bg-orange-100"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Shipping locations</label>
                      <select name="shippingLocations" className={inputCls}>
                        <option value="Pan-India">Pan-India</option>
                        <option value="Local cities">Local cities</option>
                        <option value="Specific states">Specific states</option>
                        <option value="International">International</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="terms"
                required
                id="termsCheck"
                className="mt-0.5 accent-[#d35400]"
              />
              <label
                htmlFor="termsCheck"
                className="text-sm text-gray-600 cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener"
                  className="text-[#d35400] hover:underline font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener"
                  className="text-[#d35400] hover:underline font-medium"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#d35400] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#b84700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : config.btnText}
              </button>
              <Link
                href="/"
                className="sm:w-auto px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

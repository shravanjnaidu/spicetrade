"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { BannerAd } from "@/types";

export default function AdDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [ad, setAd] = useState<BannerAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No ad specified.");
      setLoading(false);
      return;
    }
    loadAd(id);
  }, [id]);

  async function loadAd(adId: string) {
    try {
      const res = await fetch(`/api/banner-ads/${adId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAd(data);
    } catch {
      setError("This ad could not be found or may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-72 bg-gray-200" />
            <div className="p-8 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-3/5" />
              <div className="h-9 bg-gray-200 rounded w-4/5" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-11/12" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-200 rounded w-48 mt-4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#d35400] mb-6"
          >
            ← Back to homepage
          </Link>
          <div className="text-center py-16 text-gray-500">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Ad not found
            </h2>
            <p>{error || "This ad could not be found or may have expired."}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const now = new Date();
  const expired = ad.expiresAt && new Date(ad.expiresAt) < now;
  const statusLabel = expired ? "Expired" : ad.status || "Active";
  const advertiser =
    (ad as any).advertiserCompany ||
    (ad as any).advertiserName ||
    ad.contactName ||
    "Advertiser";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#d35400] mb-6"
        >
          ← Back to homepage
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          {/* Banner image */}
          {ad.imageUrl && (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full max-h-[420px] object-cover"
            />
          )}

          <div className="p-8">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  expired
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-xs text-gray-400">
                Sponsored by{" "}
                <strong className="text-gray-600">{advertiser}</strong>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {ad.title}
            </h1>

            {/* Description */}
            {ad.description && (
              <p className="text-base text-gray-600 leading-relaxed mb-7">
                {ad.description}
              </p>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
              <InfoCard label="Advertiser" value={advertiser} />

              {ad.industry && <InfoCard label="Industry" value={ad.industry} />}

              {ad.adAddress && (
                <InfoCard label="Location" value={ad.adAddress} />
              )}

              {ad.contactNumber && (
                <InfoCard
                  label="Contact"
                  value={`${ad.contactName ? ad.contactName + " · " : ""}${ad.contactNumber}`}
                />
              )}

              {ad.targetUrl && (
                <InfoCard
                  label="Destination"
                  value={
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all font-normal text-xs"
                    >
                      {ad.targetUrl}
                    </a>
                  }
                />
              )}

              {(ad as any).createdAt && (
                <InfoCard
                  label="Published"
                  value={new Date((ad as any).createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                />
              )}

              {ad.expiresAt && (
                <InfoCard
                  label="Valid until"
                  value={new Date(ad.expiresAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              )}

              {(ad as any).notes && (
                <div className="sm:col-span-2">
                  <InfoCard label="Notes" value={(ad as any).notes} />
                </div>
              )}
            </div>

            {/* CTA */}
            {ad.targetUrl && (
              <div>
                <a
                  href={ad.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3.5 bg-[#e47911] text-white rounded-xl font-bold text-base hover:bg-[#c85e00] transition-colors"
                >
                  Visit Website →
                </a>
                <p className="mt-3 text-xs text-gray-400">
                  This is a paid advertisement. BigSpice is not responsible for
                  the content of external websites.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

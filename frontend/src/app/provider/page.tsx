"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle2, Clock3, Plus, Star, Wallet } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

type ProviderDashboardResponse = {
  provider: {
    id: string;
    full_name: string;
    email: string;
  };
  summary: {
    total_listings: number;
    active_listings: number;
    pending_listings: number;
    rejected_listings: number;
    total_bookings: number;
    confirmed_bookings: number;
    total_reviews: number;
    avg_rating: number;
    total_revenue: number;
    currency: string;
  };
  listings: Array<{
    id: string;
    title: string;
    category: string;
    district: string;
    province: string;
    thumbnail: string | null;
    approval_status: "PENDING" | "APPROVED" | "REJECTED";
    is_verified: boolean;
    avg_rating: number;
    total_reviews: number;
    total_bookings: number;
    confirmed_bookings: number;
    total_revenue: number;
    price_per_person: number;
    currency: string;
    created_at: string;
  }>;
  latest_reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    experience: {
      id: string;
      title: string;
      approval_status: "PENDING" | "APPROVED" | "REJECTED";
    } | null;
    reviewer: {
      id: string;
      full_name: string;
    } | null;
  }>;
};

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
};

const statusBadgeClass: Record<"PENDING" | "APPROVED" | "REJECTED", string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toLocaleString()}`;
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function ProviderDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "reviews">("overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ProviderDashboardResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("Please log in as a provider.");
        }

        const response = await fetch(`${API_BASE}/experiences/provider/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as ApiEnvelope<ProviderDashboardResponse>;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load provider dashboard.");
        }

        setDashboard(data.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load provider dashboard.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = dashboard?.summary;
  const listings = dashboard?.listings ?? [];
  const latestReviews = dashboard?.latest_reviews ?? [];

  const topListing = useMemo(() => {
    const source = dashboard?.listings ?? [];
    if (!source.length) return null;
    return [...source].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  }, [dashboard?.listings]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:py-10">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                Provider Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {dashboard?.provider.full_name || "Provider"} •{" "}
                {dashboard?.provider.email || "Loading..."}
              </p>
            </div>
            <Link
              href="/provider/add"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Add Experience
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
            Loading provider data...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Wallet size={16} />
                  Revenue
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {formatCurrency(summary.total_revenue, summary.currency)}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} />
                  Total Bookings
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {summary.total_bookings}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star size={16} />
                  Avg Rating
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{summary.avg_rating}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock3 size={16} />
                  Listings
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {summary.total_listings} total
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-gray-200">
              {(["overview", "listings", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-t-xl px-4 py-2 text-sm font-medium capitalize ${activeTab === tab
                      ? "border border-b-0 border-gray-300 bg-white text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900">Listing Status</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-lg font-semibold text-emerald-700">
                        {summary.active_listings}
                      </div>
                      <div className="text-emerald-700/80">Approved</div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="text-lg font-semibold text-amber-700">
                        {summary.pending_listings}
                      </div>
                      <div className="text-amber-700/80">Pending</div>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <div className="text-lg font-semibold text-rose-700">
                        {summary.rejected_listings}
                      </div>
                      <div className="text-rose-700/80">Rejected</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900">Top Performing Experience</h3>
                  {topListing ? (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="font-medium text-gray-900">{topListing.title}</div>
                      <div className="text-gray-600">
                        {topListing.district}, {topListing.province}
                      </div>
                      <div className="text-gray-600">
                        Revenue: {formatCurrency(topListing.total_revenue, topListing.currency)}
                      </div>
                      <div className="text-gray-600">
                        Rating: {topListing.avg_rating} ({topListing.total_reviews} reviews)
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">No experiences yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "listings" && (
              <div className="space-y-3">
                {!listings.length && (
                  <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
                    No submitted experiences yet.
                  </div>
                )}
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{listing.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {listing.category.replace("_", " ")} • {listing.district}, {listing.province}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[listing.approval_status]}`}
                      >
                        {listing.approval_status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <div className="text-gray-500">Revenue</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(listing.total_revenue, listing.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Bookings</div>
                        <div className="font-semibold text-gray-900">{listing.total_bookings}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Avg Rating</div>
                        <div className="font-semibold text-gray-900">{listing.avg_rating}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Reviews</div>
                        <div className="font-semibold text-gray-900">{listing.total_reviews}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-3">
                {!latestReviews.length && (
                  <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
                    No reviews yet.
                  </div>
                )}
                {latestReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {review.experience?.title || "Experience"}
                      </div>
                      <div className="text-sm text-amber-600">{"★".repeat(review.rating)}</div>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{review.comment || "No comment."}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {review.reviewer?.full_name || "Traveler"} •{" "}
                      {formatRelativeDate(review.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "@/lib/authStore";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type ProviderBookingDashboardResponse = {
  provider: {
    id: string;
    full_name: string;
    email: string;
  };
  summary: {
    total_bookings: number;
    pending_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    completed_bookings: number;
    revenue: number;
    currency: string;
  };
  bookings: Array<{
    id: string;
    booking_date: string;
    created_at: string;
    num_guests: number;
    total_amount: number;
    currency: string;
    status: BookingStatus;
    experience: {
      id: string;
      title: string;
      location_name: string;
      thumbnail?: string | null;
    } | null;
    traveler: {
      id: string;
      full_name: string;
      email: string;
    } | null;
  }>;
  analytics: {
    daily: Array<{
      date: string;
      bookings: number;
      revenue: number;
      pending: number;
      confirmed: number;
      cancelled: number;
      completed: number;
    }>;
  };
};

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
};

const statusBadgeClass: Record<BookingStatus, string> = {
  pending: "border-tertiary-fixed-dim bg-tertiary-fixed text-on-tertiary-fixed",
  confirmed: "border-secondary/25 bg-secondary-fixed text-on-secondary-fixed",
  cancelled: "border-error-container bg-error-container text-on-error-container",
  completed: "border-primary-fixed-dim bg-primary-fixed text-on-primary-fixed",
};

const statusLabel: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Rejected",
  completed: "Completed",
};

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toLocaleString()}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function ProviderBookingDashboardPage() {
  const { hasHydrated, hydrateFromStorage, token } = useAuthStore();
  const [dashboard, setDashboard] = useState<ProviderBookingDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "bookings">("overview");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const loadDashboard = async (authToken: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/bookings/provider/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const payload = (await response.json()) as ApiEnvelope<ProviderBookingDashboardResponse>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load provider bookings.");
      }

      setDashboard(payload.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load provider bookings.";
      setError(message);
      setDashboard(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) {
      hydrateFromStorage();
      return;
    }

    if (!token) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    loadDashboard(token);
  }, [hasHydrated, hydrateFromStorage, token]);

  const summary = dashboard?.summary;
  const bookings = dashboard?.bookings ?? [];

  const chartData = useMemo(() => {
    const source = dashboard?.analytics?.daily ?? [];
    return source.map((entry) => ({
      ...entry,
      revenue: Number(entry.revenue.toFixed(0)),
    }));
  }, [dashboard?.analytics?.daily]);

  const handleStatusUpdate = async (bookingId: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    if (!token) return;

    try {
      setUpdatingBookingId(bookingId);
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as ApiEnvelope<ProviderBookingDashboardResponse["bookings"][number]>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to update booking.");
      }

      toast.success(status === "COMPLETED" ? "Trip completed and medal issued." : "Booking status updated.");
      await loadDashboard(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update booking.";
      toast.error(message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mandala-pattern flex min-h-screen items-center justify-center bg-surface">
        <div className="spinner" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mandala-pattern flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-md border border-outline-variant bg-white p-8 text-center shadow-[0_18px_60px_rgba(18,28,44,0.08)]">
          <h1 className="font-h2 text-3xl text-on-surface">Provider login required</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Sign in to view and manage your bookings.</p>
          <Link href="/login" className="mt-5 inline-flex bg-primary-container px-5 py-2.5 font-serif text-sm text-on-primary-container transition hover:brightness-110">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mandala-pattern flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-md border border-outline-variant bg-white p-8 text-center shadow-[0_18px_60px_rgba(18,28,44,0.08)]">
          <h1 className="font-h2 text-3xl text-on-surface">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{error || "Unable to load bookings dashboard."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mandala-pattern min-h-screen bg-[radial-gradient(circle_at_14%_10%,rgba(192,86,33,0.12),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(55,104,80,0.14),transparent_28%),linear-gradient(180deg,#f9f9ff_0%,#f0f3ff_55%,#ffffff_100%)] px-4 py-8 md:py-10">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: { borderRadius: "2px", border: "1px solid #dec0b5" },
        }}
      />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="border-l-4 border-primary-container bg-white/80 p-5 shadow-[0_18px_60px_rgba(18,28,44,0.08)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase text-primary">Nepal Uncharted</p>
              <h1 className="mt-3 font-h1 text-4xl text-on-surface md:text-h1">Provider Bookings</h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                {dashboard.provider.full_name} | {dashboard.provider.email}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
              <Compass size={17} className="text-secondary" />
              Last 14 days
            </div>
          </div>
        </div>

        {error && (
          <div className="border border-error-container bg-error-container p-4 text-sm text-on-error-container">
            {error}
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  label: "Total",
                  value: summary.total_bookings,
                  icon: <CalendarClock size={16} />,
                  color: "text-on-surface",
                },
                {
                  label: "Pending",
                  value: summary.pending_bookings,
                  icon: <Clock3 size={16} />,
                  color: "text-tertiary",
                },
                {
                  label: "Confirmed",
                  value: summary.confirmed_bookings,
                  icon: <CheckCircle2 size={16} />,
                  color: "text-secondary",
                },
                {
                  label: "Rejected",
                  value: summary.cancelled_bookings,
                  icon: <XCircle size={16} />,
                  color: "text-error",
                },
                {
                  label: "Completed",
                  value: summary.completed_bookings,
                  icon: <CheckCircle2 size={16} />,
                  color: "text-primary",
                },
                {
                  label: "Revenue",
                  value: formatCurrency(summary.revenue, summary.currency),
                  icon: <Wallet size={16} />,
                  color: "text-on-surface",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-outline-variant bg-white p-4 shadow-[0_10px_30px_rgba(18,28,44,0.04)] transition hover:-translate-y-0.5 hover:border-primary"
                >
                  <div className="flex items-center gap-2 text-xs uppercase text-on-surface-variant">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className={`mt-3 font-serif text-xl ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-b border-outline-variant">
              {(["overview", "bookings"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 font-serif text-sm capitalize transition ${
                    activeTab === tab
                      ? "border border-b-0 border-outline-variant bg-white text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="animate-fade-in-up border border-outline-variant bg-white p-5 shadow-[0_14px_40px_rgba(18,28,44,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-h3 text-2xl text-on-surface">Booking activity</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">Bookings and revenue over time</p>
                  </div>
                  <BarChart3 className="text-primary" size={20} strokeWidth={1.8} />
                </div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D5016" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2D5016" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C45A3C" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C45A3C" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(87,66,58,0.14)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#57423a" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#57423a" }} />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #dec0b5",
                          borderRadius: 2,
                          boxShadow: "0 12px 30px rgba(18,28,44,0.12)",
                        }}
                      />
                      <Area type="monotone" dataKey="bookings" stroke="#2D5016" fill="url(#bookingsFill)" strokeWidth={2} />
                      <Area type="monotone" dataKey="revenue" stroke="#C45A3C" fill="url(#revenueFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="animate-fade-in-up space-y-3">
                {!bookings.length && (
                  <div className="border border-outline-variant bg-white p-5 text-sm text-on-surface-variant">
                    No bookings yet.
                  </div>
                )}
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-outline-variant bg-white p-4 shadow-[0_10px_30px_rgba(18,28,44,0.04)] transition hover:-translate-y-0.5 hover:border-primary md:p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="font-serif text-lg text-on-surface">
                          {booking.experience?.title || "Experience"}
                        </div>
                        <div className="text-xs uppercase text-primary">
                          {booking.experience?.location_name || "Location unavailable"}
                        </div>
                        <div className="text-sm text-on-surface-variant">
                          Traveler: {booking.traveler?.full_name || "Unknown"} | {booking.traveler?.email || "-"}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-on-surface-variant sm:grid-cols-3">
                          <span className="border border-outline-variant bg-surface-container-lowest px-2.5 py-2">
                            {formatDate(booking.booking_date)}
                          </span>
                          <span className="border border-outline-variant bg-surface-container-lowest px-2.5 py-2">
                            {booking.num_guests} guests
                          </span>
                          <span className="border border-outline-variant bg-surface-container-lowest px-2.5 py-2 font-medium text-on-surface">
                            {formatCurrency(booking.total_amount, booking.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <span
                          className={`inline-flex border px-2.5 py-1 text-xs font-medium ${statusBadgeClass[booking.status]}`}
                        >
                          {statusLabel[booking.status]}
                        </span>
                        {booking.experience?.id && (
                          <Link
                            href={`/experience/${booking.experience.id}`}
                            className="text-xs font-medium text-primary transition hover:text-secondary"
                          >
                            View experience
                          </Link>
                        )}
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={updatingBookingId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                              className="border border-secondary/25 bg-secondary-fixed px-3 py-1.5 text-xs font-semibold text-on-secondary-fixed transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={updatingBookingId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                              className="border border-error-container bg-error-container px-3 py-1.5 text-xs font-semibold text-on-error-container transition hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={updatingBookingId === booking.id}
                            onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                            className="border border-primary-fixed-dim bg-primary-fixed px-3 py-1.5 text-xs font-semibold text-on-primary-fixed transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark completed
                          </button>
                        )}
                      </div>
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

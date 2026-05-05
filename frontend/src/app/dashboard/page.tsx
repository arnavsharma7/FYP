"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Award, CalendarX, Eye, HandCoins, MoreVertical, Trash2, X } from "lucide-react";
import { deleteUserTrail, getUserDashboard, getUserTrails } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

interface Booking {
    id: string;
    booking_date: string;
    num_guests: number;
    total_amount: number;
    currency: string;
    status: string;
    experience?: {
        id: string;
        title: string;
        location_name: string;
        thumbnail?: string | null;
        images?: string[];
    } | null;
}

interface ImpactDistribution {
    category: string;
    amount: number;
    percentage: number;
}

interface ImpactRegion {
    district: string;
    bookings: number;
    travelers: number;
    revenue: number;
    local_earnings: number;
    community_fund: number;
}

interface TouristImpact {
    total_bookings: number;
    travelers_served: number;
    total_revenue_generated: number;
    base_amount: number;
    tax_amount: number;
    local_earnings_amount: number;
    community_fund_amount: number;
    platform_fee_amount: number;
    operations_amount: number;
    providers_supported: number;
    families_supported: number;
    districts_reached: number;
    community_share_percentage: number;
    distribution: ImpactDistribution[];
    regional: ImpactRegion[];
}

interface ImpactCertificate {
    id: string;
    title: string;
    medal_type: string;
    certificate_code: string;
    impact_summary: {
        experience_title?: string;
        location_name?: string | null;
        district?: string | null;
        guests?: number;
        currency?: string;
        total_amount?: number;
        local_earnings_amount?: number;
        community_fund_amount?: number;
        tax_amount?: number;
    };
    issued_at: string;
    experience?: {
        id: string;
        title: string;
        location_name: string;
        district?: string;
        thumbnail?: string | null;
    } | null;
}

interface DashboardData {
    role: string;
    user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        joined_at: string;
    };
    stats: {
        total_trips: number;
        upcoming: number;
        saved_trails: number;
        completed: number;
    };
    impact?: TouristImpact;
    certificates?: ImpactCertificate[];
    bookings: Booking[];
}

interface SavedTrail {
    id: string;
    title: string;
    description?: string;
    difficulty: string;
    duration_days: number;
    total_cost_estimate: number;
    currency: string;
    interests: string[];
    travel_style: string;
    days?: unknown[];
    created_at?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "rgba(45, 80, 22, 0.1)", text: "var(--forest-green)" },
    pending: { bg: "rgba(212, 168, 67, 0.1)", text: "var(--warm-brown)" },
    completed: { bg: "rgba(27, 42, 74, 0.08)", text: "var(--deep-indigo)" },
    cancelled: { bg: "rgba(196, 90, 60, 0.1)", text: "var(--terracotta)" },
};

function relativeDate(value?: string) {
    if (!value) return "recently";

    const diffMs = Date.now() - new Date(value).getTime();
    const days = Math.floor(diffMs / 86400000);

    if (Number.isNaN(days)) return "recently";
    if (days <= 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;

    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
}

function formatCurrency(value = 0, currency = "NPR") {
    return `${currency} ${value.toLocaleString()}`;
}

export default function DashboardPage() {
    const { hasHydrated, hydrateFromStorage, token } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [savedTrails, setSavedTrails] = useState<SavedTrail[]>([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [openTrailMenu, setOpenTrailMenu] = useState<string | null>(null);
    const [openBookingMenu, setOpenBookingMenu] = useState<string | null>(null);
    const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingTrailId, setDeletingTrailId] = useState<string | null>(null);
    const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

    useEffect(() => {
        if (!hasHydrated) hydrateFromStorage();
    }, [hasHydrated, hydrateFromStorage]);

    useEffect(() => {
        async function loadDashboard() {
            if (!hasHydrated) return;

            if (!token) {
                setData(null);
                setSavedTrails([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError("");

            const [dashboardRes, trailsRes] = await Promise.all([
                getUserDashboard(token),
                getUserTrails(token),
            ]);

            if (!dashboardRes?.data) {
                setError("Could not load your dashboard. Please sign in again or retry.");
            } else {
                setData(dashboardRes.data);
            }

            if (Array.isArray(trailsRes?.data)) {
                setSavedTrails(trailsRes.data);
            } else {
                setSavedTrails([]);
            }

            setIsLoading(false);
        }

        loadDashboard();
    }, [hasHydrated, token]);

    const handleDeleteTrail = async (trail: SavedTrail) => {
        if (!token) return;
        if (!window.confirm(`Delete saved trail "${trail.title}"? This cannot be undone.`)) return;

        setDeletingTrailId(trail.id);
        const res = await deleteUserTrail(token, trail.id);

        if (res?.success) {
            setSavedTrails((current) => current.filter((item) => item.id !== trail.id));
            setData((current) => current
                ? { ...current, stats: { ...current.stats, saved_trails: Math.max(0, current.stats.saved_trails - 1) } }
                : current);
        } else {
            setError("Could not delete this trail. Please retry.");
        }

        setOpenTrailMenu(null);
        setDeletingTrailId(null);
    };

    const canCancelBooking = (booking: Booking) =>
        ["pending", "confirmed"].includes(booking.status.toLowerCase());

    const handleCancelBooking = async () => {
        if (!token || !bookingToCancel) return;

        setCancellingBookingId(bookingToCancel.id);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/bookings/${bookingToCancel.id}/cancel`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.message || "Could not cancel this booking.");
            }

            setData((current) => {
                if (!current) return current;
                const wasUpcoming = ["pending", "confirmed"].includes(bookingToCancel.status.toLowerCase());
                return {
                    ...current,
                    stats: {
                        ...current.stats,
                        upcoming: wasUpcoming ? Math.max(0, current.stats.upcoming - 1) : current.stats.upcoming,
                    },
                    bookings: current.bookings.map((booking) =>
                        booking.id === bookingToCancel.id ? { ...booking, status: "cancelled" } : booking
                    ),
                };
            });
            setBookingToCancel(null);
            setOpenBookingMenu(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not cancel this booking.";
            setError(message);
        } finally {
            setCancellingBookingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center px-4" style={{ background: "var(--himalayan-cream)" }}>
                <div className="glass-card rounded-2xl p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Sign in required</h1>
                    <p className="text-sm mb-6" style={{ color: "var(--slate-medium)" }}>Your dashboard is tied to your bearer token, not a URL user id.</p>
                    <Link href="/login" className="btn-primary inline-block">Sign In</Link>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center px-4" style={{ background: "var(--himalayan-cream)" }}>
                <div className="glass-card rounded-2xl p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Dashboard unavailable</h1>
                    <p className="text-sm" style={{ color: "var(--slate-medium)" }}>{error || "Could not load your dashboard."}</p>
                </div>
            </div>
        );
    }

    const confirmedBookings = data.bookings.filter((booking) => booking.status === "confirmed");
    const certificates = data.certificates || [];
    const impact = data.impact;
    const impactCurrency = certificates[0]?.impact_summary?.currency || data.bookings[0]?.currency || "NPR";

    return (
        <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
            <div className="py-10" style={{ background: "var(--deep-indigo)" }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, var(--terracotta), var(--temple-gold))" }}>👤</div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--himalayan-white)" }}>
                                Welcome back, {data.user.full_name}
                            </h1>
                            <p className="text-sm" style={{ color: "rgba(245, 240, 235, 0.6)" }}>
                                {data.role} dashboard • {data.stats.total_trips} bookings • {data.stats.saved_trails} saved trails
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {error && (
                    <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)" }}>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Bookings", value: data.stats.total_trips, icon: "🗺️", color: "var(--terracotta)" },
                        { label: "Upcoming", value: data.stats.upcoming, icon: "📅", color: "var(--forest-green)" },
                        { label: "Saved Trails", value: savedTrails.length, icon: "🏔️", color: "var(--warm-brown)" },
                        { label: "Completed", value: data.stats.completed, icon: "✅", color: "var(--deep-indigo)" },
                        { label: "Medals", value: certificates.length, icon: "🏅", color: "var(--warm-brown)" },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-xl p-5 text-center">
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: stat.color }}>{stat.value}</div>
                            <div className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-1 mb-6" style={{ borderBottom: "2px solid rgba(27, 42, 74, 0.1)" }}>
                    {["overview", "bookings", "impact", "saved"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className="px-5 py-3 text-sm font-medium transition-all rounded-t-lg" style={{
                            color: activeTab === tab ? "var(--terracotta)" : "var(--slate-medium)",
                            borderBottom: activeTab === tab ? "2px solid var(--terracotta)" : "2px solid transparent",
                            fontFamily: "var(--font-heading)",
                            marginBottom: "-2px",
                        }}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Upcoming Trip</h3>
                            {confirmedBookings.length > 0 ? confirmedBookings.map(booking => (
                                <div key={booking.id} className="p-4 rounded-lg" style={{ background: "rgba(45, 80, 22, 0.04)" }}>
                                    <h4 className="font-bold text-sm" style={{ color: "var(--deep-indigo)" }}>{booking.experience?.title}</h4>
                                    <p className="text-xs mt-1" style={{ color: "var(--warm-brown)" }}>📍 {booking.experience?.location_name}</p>
                                    <p className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>📅 {new Date(booking.booking_date).toLocaleDateString()} • {booking.num_guests} guests</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColors.confirmed.bg, color: statusColors.confirmed.text }}>Confirmed</span>
                                        <span className="text-sm font-bold" style={{ color: "var(--terracotta)" }}>{booking.currency} {booking.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : <p className="text-sm" style={{ color: "var(--slate-medium)" }}>No upcoming trips. Start planning your next adventure!</p>}
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Quick Actions</h3>
                            <div className="space-y-3">
                                <Link href="/trail-builder" className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50">
                                    <span className="text-xl">🏔️</span>
                                    <div><span className="text-sm font-medium" style={{ color: "var(--deep-indigo)" }}>Build New Trail</span><p className="text-xs" style={{ color: "var(--slate-medium)" }}>Create a route from real provider experiences</p></div>
                                </Link>
                                <button onClick={() => setActiveTab("saved")} className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50 text-left">
                                    <span className="text-xl">📌</span>
                                    <div><span className="text-sm font-medium" style={{ color: "var(--deep-indigo)" }}>View Saved Trails</span><p className="text-xs" style={{ color: "var(--slate-medium)" }}>Open, inspect, or delete generated plans</p></div>
                                </button>
                                <Link href="/marketplace" className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50">
                                    <span className="text-xl">🎨</span>
                                    <div><span className="text-sm font-medium" style={{ color: "var(--deep-indigo)" }}>Browse Experiences</span><p className="text-xs" style={{ color: "var(--slate-medium)" }}>Find something new</p></div>
                                </Link>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-6 lg:col-span-2">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Your Community Impact</h3>
                                    <p className="mt-1 text-sm" style={{ color: "var(--slate-medium)" }}>
                                        Estimated from your active bookings, including local earnings, community fund, platform fee, and taxes.
                                    </p>
                                </div>
                                <button type="button" onClick={() => setActiveTab("impact")} className="btn-primary w-fit">
                                    View medals
                                </button>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {[
                                    { label: "Local earnings", value: formatCurrency(impact?.local_earnings_amount || 0, impactCurrency) },
                                    { label: "Community fund", value: formatCurrency(impact?.community_fund_amount || 0, impactCurrency) },
                                    { label: "Families supported", value: impact?.families_supported || 0 },
                                    { label: "Districts reached", value: impact?.districts_reached || 0 },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg p-4" style={{ background: "rgba(45, 80, 22, 0.04)" }}>
                                        <div className="text-xs" style={{ color: "var(--slate-medium)" }}>{item.label}</div>
                                        <div className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "bookings" && (
                    <div className="space-y-4 animate-fade-in">
                        {data.bookings.length > 0 ? data.bookings.map(booking => (
                            <div key={booking.id} className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style={{ background: "rgba(196, 90, 60, 0.1)" }}>🗺️</div>
                                    <div>
                                        <h4 className="font-bold text-sm" style={{ color: "var(--deep-indigo)" }}>{booking.experience?.title}</h4>
                                        <p className="text-xs" style={{ color: "var(--warm-brown)" }}>📍 {booking.experience?.location_name}</p>
                                        <p className="text-xs" style={{ color: "var(--slate-medium)" }}>📅 {new Date(booking.booking_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: statusColors[booking.status]?.bg || statusColors.pending.bg, color: statusColors[booking.status]?.text || statusColors.pending.text }}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                                    <span className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>{booking.currency} {booking.total_amount.toLocaleString()}</span>
                                    <button
                                        type="button"
                                        onClick={() => setOpenBookingMenu(openBookingMenu === booking.id ? null : booking.id)}
                                        className="p-2 rounded-lg transition-all hover:bg-gray-50"
                                        aria-label="Open booking menu"
                                        aria-expanded={openBookingMenu === booking.id}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                {openBookingMenu === booking.id && (
                                    <div className="absolute right-5 top-16 z-10 w-48 rounded-xl border bg-white p-2 shadow-lg" style={{ borderColor: "rgba(27,42,74,0.1)" }}>
                                        {booking.experience?.id && (
                                            <Link href={`/experience/${booking.experience.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50" style={{ color: "var(--deep-indigo)" }}>
                                                <Eye size={15} /> View experience
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            disabled={!canCancelBooking(booking) || cancellingBookingId === booking.id}
                                            onClick={() => {
                                                setBookingToCancel(booking);
                                                setOpenBookingMenu(null);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                                            style={{ color: "var(--terracotta)" }}
                                        >
                                            <CalendarX size={15} /> Cancel booking
                                        </button>
                                    </div>
                                )}
                            </div>
                        )) : <EmptySavedState type="bookings" />}
                    </div>
                )}

                {activeTab === "impact" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(45, 80, 22, 0.1)", color: "var(--forest-green)" }}>
                                    <HandCoins size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Tourist Impact Ledger</h3>
                                    <p className="mt-1 text-sm" style={{ color: "var(--slate-medium)" }}>
                                        Pending, confirmed, and completed bookings count here so you can see expected impact right after booking. Cancelled bookings are excluded, and medals are issued only after completion.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {[
                                    { label: "Active booking spend", value: formatCurrency(impact?.total_revenue_generated || 0, impactCurrency) },
                                    { label: "Local earnings", value: formatCurrency(impact?.local_earnings_amount || 0, impactCurrency) },
                                    { label: "Community fund", value: formatCurrency(impact?.community_fund_amount || 0, impactCurrency) },
                                    { label: "Tax and operations", value: formatCurrency((impact?.tax_amount || 0) + (impact?.operations_amount || 0), impactCurrency) },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border p-4" style={{ borderColor: "rgba(27,42,74,0.1)", background: "rgba(255,255,255,0.65)" }}>
                                        <div className="text-xs" style={{ color: "var(--slate-medium)" }}>{item.label}</div>
                                        <div className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                {(impact?.distribution || []).map((item) => (
                                    <div key={item.category}>
                                        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--slate-medium)" }}>
                                            <span>{item.category}</span>
                                            <span>{item.percentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(27,42,74,0.08)" }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.percentage)}%`, background: "var(--forest-green)" }} />
                                        </div>
                                        <div className="mt-1 text-xs font-medium" style={{ color: "var(--deep-indigo)" }}>{formatCurrency(item.amount, impactCurrency)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Achievement Medals</h3>
                            {certificates.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {certificates.map((certificate) => (
                                        <div key={certificate.id} className="glass-card rounded-xl p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--temple-gold), var(--terracotta))", color: "white" }}>
                                                    <Award size={28} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold" style={{ color: "var(--deep-indigo)" }}>{certificate.title}</h4>
                                                    <p className="mt-1 text-xs uppercase" style={{ color: "var(--warm-brown)" }}>{certificate.medal_type.replaceAll("-", " ")}</p>
                                                    <p className="mt-2 text-sm" style={{ color: "var(--slate-medium)" }}>
                                                        {certificate.experience?.location_name || certificate.impact_summary.location_name || "Heritage experience"} • issued {new Date(certificate.issued_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 rounded-lg p-3 text-xs" style={{ background: "rgba(212, 168, 67, 0.12)", color: "var(--deep-indigo)" }}>
                                                Certificate {certificate.certificate_code} supports {formatCurrency(certificate.impact_summary.local_earnings_amount || 0, certificate.impact_summary.currency || impactCurrency)} in local earnings and {formatCurrency(certificate.impact_summary.community_fund_amount || 0, certificate.impact_summary.currency || impactCurrency)} in community funds.
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-14 glass-card rounded-xl">
                                    <div className="text-5xl mb-4">🏅</div>
                                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>No Medals Yet</h3>
                                    <p className="text-sm mb-6" style={{ color: "var(--slate-medium)" }}>Complete a confirmed experience to receive your first achievement medal.</p>
                                    <button type="button" onClick={() => setActiveTab("bookings")} className="btn-primary">View bookings</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "saved" && (
                    savedTrails.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                            {savedTrails.map(trail => (
                                <div key={trail.id} className="glass-card rounded-xl p-5 relative">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{trail.title}</h3>
                                            <p className="text-xs mt-1" style={{ color: "var(--warm-brown)" }}>{trail.travel_style} • {trail.difficulty} • saved {relativeDate(trail.created_at)}</p>
                                        </div>
                                        <button onClick={() => setOpenTrailMenu(openTrailMenu === trail.id ? null : trail.id)} className="p-2 rounded-lg transition-all hover:bg-gray-50" aria-label="Open trail menu">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>

                                    {openTrailMenu === trail.id && (
                                        <div className="absolute right-5 top-14 z-10 w-44 rounded-xl border bg-white p-2 shadow-lg" style={{ borderColor: "rgba(27,42,74,0.1)" }}>
                                            <Link href={`/dashboard/trails/${trail.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50" style={{ color: "var(--deep-indigo)" }}>
                                                <Eye size={15} /> View full trail
                                            </Link>
                                            <button disabled={deletingTrailId === trail.id} onClick={() => handleDeleteTrail(trail)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-red-50 disabled:opacity-50" style={{ color: "var(--terracotta)" }}>
                                                <Trash2 size={15} /> Delete trail
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--slate-medium)" }}>{trail.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {trail.interests.map(interest => <span key={interest} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(212, 168, 67, 0.12)", color: "var(--warm-brown)" }}>{interest}</span>)}
                                    </div>
                                    <div className="flex items-center justify-between text-sm" style={{ color: "var(--deep-indigo)" }}>
                                        <span>{trail.duration_days} days • {trail.days?.length || trail.duration_days} planned stops</span>
                                        <span className="font-bold">{trail.currency} {trail.total_cost_estimate.toLocaleString()}</span>
                                    </div>
                                    <Link href={`/dashboard/trails/${trail.id}`} className="mt-4 inline-block text-xs font-bold" style={{ color: "var(--terracotta)" }}>Open full itinerary →</Link>
                                </div>
                            ))}
                        </div>
                    ) : <EmptySavedState type="trails" />
                )}
            </div>

            <CancelBookingDialog
                booking={bookingToCancel}
                isCancelling={Boolean(bookingToCancel && cancellingBookingId === bookingToCancel.id)}
                onClose={() => setBookingToCancel(null)}
                onConfirm={handleCancelBooking}
            />
        </div>
    );
}

function CancelBookingDialog({
    booking,
    isCancelling,
    onClose,
    onConfirm,
}: {
    booking: Booking | null;
    isCancelling: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="cancel-booking-title" aria-describedby="cancel-booking-description">
            <div className="box-border w-[min(92vw,28rem)] shrink-0 rounded-xl border bg-white p-6 shadow-2xl" style={{ borderColor: "rgba(196, 90, 60, 0.25)" }}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(196, 90, 60, 0.12)", color: "var(--terracotta)" }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div className="min-w-0">
                            <h2 id="cancel-booking-title" className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                Cancel this booking?
                            </h2>
                            <p className="truncate text-xs" style={{ color: "var(--warm-brown)" }}>
                                {booking.experience?.title || "Experience booking"}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={isCancelling} className="shrink-0 rounded-lg p-2 hover:bg-gray-50 disabled:opacity-50" aria-label="Close confirmation">
                        <X size={17} />
                    </button>
                </div>

                <p id="cancel-booking-description" className="mt-4 text-sm leading-6" style={{ color: "var(--slate-medium)" }}>
                    This will cancel your {new Date(booking.booking_date).toLocaleDateString()} booking for {booking.num_guests} guest{booking.num_guests === 1 ? "" : "s"}. You can only cancel pending or confirmed bookings.
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isCancelling}
                        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                        style={{ borderColor: "rgba(27,42,74,0.12)", color: "var(--deep-indigo)" }}
                    >
                        No, keep booking
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isCancelling}
                        className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                        style={{ background: "var(--terracotta)" }}
                    >
                        {isCancelling ? "Cancelling..." : "Yes, cancel it"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptySavedState({ type }: { type: "trails" | "bookings" }) {
    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">{type === "trails" ? "🏔️" : "📋"}</div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                {type === "trails" ? "No Saved Trails Yet" : "No Bookings Yet"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--slate-medium)" }}>
                {type === "trails" ? "Build a trail while signed in and it will appear here." : "Book an experience and it will appear here."}
            </p>
            <Link href={type === "trails" ? "/trail-builder" : "/marketplace"} className="btn-primary inline-block">
                {type === "trails" ? "Build Trail" : "Browse Marketplace"}
            </Link>
        </div>
    );
}

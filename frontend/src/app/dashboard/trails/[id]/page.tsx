"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { deleteUserTrail, getUserTrail } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

interface TrailDay {
    day_number: number;
    title: string;
    description: string;
    location: string;
    estimated_cost: number;
    planning_reason?: string;
    experience_id?: string | null;
    experience?: {
        id: string;
        title: string;
        category: string;
        avg_rating: number;
        price_per_person: number;
        location_name?: string;
        thumbnail?: string | null;
    } | null;
}

interface SavedTrailDetail {
    id: string;
    title: string;
    description?: string;
    difficulty: string;
    duration_days: number;
    total_cost_estimate: number;
    currency: string;
    interests: string[];
    travel_style: string;
    days: TrailDay[];
    created_at?: string;
}

function getCategoryBadge(category: string) {
    const map: Record<string, string> = {
        homestay: "badge-homestay",
        guide: "badge-guide",
        workshop: "badge-workshop",
        heritage_site: "badge-heritage",
    };
    return map[category] || "badge-heritage";
}

function DayCard({ day, currency }: { day: TrailDay; currency: string }) {
    return (
        <div style={{ width: "100%", minWidth: 0, overflowWrap: "break-word" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider min-w-0" style={{ color: "var(--terracotta)" }}>
                    📍 {day.location}
                </div>
                {day.experience && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 ${getCategoryBadge(day.experience.category)}`}>
                        {day.experience.category?.replace("_", " ")}
                    </span>
                )}
            </div>

            <h2 className="text-lg font-bold mb-2 text-slate-800 break-words" style={{ fontFamily: "var(--font-heading)", lineHeight: 1.35 }}>
                {day.title}
            </h2>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed" style={{ width: "100%", maxWidth: "none", display: "block" }}>
                {day.description}
            </p>

            {day.planning_reason && (
                <div className="flex gap-2 p-3 rounded-xl mb-4" style={{ background: "rgba(212, 168, 67, 0.08)", border: "1px solid rgba(212, 168, 67, 0.2)" }}>
                    <span className="text-sm mt-0.5">🕐</span>
                    <p className="text-xs italic" style={{ color: "var(--warm-brown)", width: "100%", maxWidth: "none", display: "block" }}>
                        <span className="font-bold not-italic">Why this: </span>{day.planning_reason}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: "1px solid rgba(139, 111, 71, 0.1)" }}>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Daily Estimate</span>
                    <span className="text-sm font-bold text-gray-900">{currency} {day.estimated_cost?.toLocaleString()}</span>
                    {day.experience && (
                        <span className="text-xs mt-1 truncate" style={{ color: "var(--slate-medium)" }}>
                            {day.experience.title}
                        </span>
                    )}
                </div>
                {day.experience && (
                    <Link
                        href={`/experience/${day.experience.id}`}
                        className="flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
                        style={{ color: "var(--terracotta)" }}
                    >
                        View <ExternalLink size={13} />
                        {day.experience.avg_rating && (
                            <span className="ml-1 flex items-center px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: "rgba(212, 168, 67, 0.15)", color: "var(--warm-brown)" }}>
                                ⭐ {day.experience.avg_rating}
                            </span>
                        )}
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function SavedTrailDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { hasHydrated, hydrateFromStorage, token } = useAuthStore();
    const [trail, setTrail] = useState<SavedTrailDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!hasHydrated) hydrateFromStorage();
    }, [hasHydrated, hydrateFromStorage]);

    useEffect(() => {
        async function loadTrail() {
            if (!hasHydrated) return;

            if (!token) {
                setIsLoading(false);
                setError("Please sign in to view this saved trail.");
                return;
            }

            setIsLoading(true);
            setError("");

            const res = await getUserTrail(token, params.id);
            if (res?.data) {
                setTrail(res.data);
            } else {
                setError("Could not load this saved trail. It may have been deleted.");
            }

            setIsLoading(false);
        }

        loadTrail();
    }, [hasHydrated, params.id, token]);

    const handleDelete = async () => {
        if (!token || !trail) return;
        if (!window.confirm(`Delete saved trail "${trail.title}"? This cannot be undone.`)) return;

        setIsDeleting(true);
        const res = await deleteUserTrail(token, trail.id);
        setIsDeleting(false);

        if (res?.success) {
            router.push("/dashboard");
            return;
        }

        setError("Could not delete this trail. Please retry.");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!trail) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center px-4" style={{ background: "var(--himalayan-cream)" }}>
                <div className="glass-card rounded-2xl p-8 max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Trail unavailable</h1>
                    <p className="text-sm mb-6" style={{ color: "var(--slate-medium)" }}>{error}</p>
                    <Link href="/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
            <div className="py-10" style={{ background: "var(--deep-indigo)" }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "rgba(245, 240, 235, 0.75)" }}>
                        <ArrowLeft size={16} /> Back to dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div style={{ width: "100%", minWidth: 0 }}>
                            <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--himalayan-white)" }}>{trail.title}</h1>
                            <p className="text-sm" style={{ color: "rgba(245, 240, 235, 0.68)", width: "100%", maxWidth: "42rem", display: "block", lineHeight: 1.6 }}>{trail.description}</p>
                            <div className="flex flex-wrap gap-2 mt-5" style={{ width: "100%" }}>
                                {trail.interests.map((interest) => (
                                    <span key={interest} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(212, 168, 67, 0.14)", color: "var(--temple-gold)" }}>{interest}</span>
                                ))}
                            </div>
                        </div>
                        <button disabled={isDeleting} onClick={handleDelete} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: "rgba(196, 90, 60, 0.16)", color: "var(--terracotta)" }}>
                            <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete Trail"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {error && <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)" }}>{error}</div>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Duration", value: `${trail.duration_days} days` },
                        { label: "Budget", value: `${trail.currency} ${trail.total_cost_estimate.toLocaleString()}` },
                        { label: "Difficulty", value: trail.difficulty },
                        { label: "Style", value: trail.travel_style },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-xl p-5 text-center">
                            <div className="text-lg font-bold capitalize" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{stat.value}</div>
                            <div className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="relative" style={{ width: "100%", maxWidth: "none" }}>
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                        style={{ background: "linear-gradient(to bottom, var(--temple-gold), var(--terracotta), transparent)" }} />

                    <div className="space-y-8" style={{ width: "100%" }}>
                        {trail.days.map((day, index) => {
                            const isLeft = index % 2 === 0;
                            return (
                                <div
                                    key={`${day.day_number}-${day.title}`}
                                    className="animate-fade-in-up"
                                    style={{ animationDelay: `${index * 70}ms`, width: "100%" }}
                                >
                                    <div className="flex gap-4 md:hidden">
                                        <div className="flex-shrink-0 flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow z-10"
                                                style={{ background: "linear-gradient(135deg, var(--terracotta), var(--temple-gold))", fontFamily: "var(--font-heading)" }}>
                                                {day.day_number}
                                            </div>
                                            {index < trail.days.length - 1 && (
                                                <div className="w-0.5 flex-1 mt-2" style={{ background: "linear-gradient(to bottom, var(--temple-gold), transparent)", minHeight: "2rem" }} />
                                            )}
                                        </div>
                                        <div className="flex-1 glass-card rounded-xl p-5 mb-2 min-w-0" style={{ width: "100%" }}>
                                            <DayCard day={day} currency={trail.currency} />
                                        </div>
                                    </div>

                                    <div
                                        className="hidden md:grid items-start"
                                        style={{
                                            width: "100%",
                                            gridTemplateColumns: "minmax(0, 1fr) 2.5rem minmax(0, 1fr)",
                                            columnGap: "2rem",
                                        }}
                                    >
                                        <div className="flex justify-end" style={{ minWidth: 0 }}>
                                            {isLeft ? (
                                                <div className="w-full glass-card rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow" style={{ maxWidth: "24rem", minWidth: "18rem" }}>
                                                    <DayCard day={day} currency={trail.currency} />
                                                </div>
                                            ) : <div />}
                                        </div>

                                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow z-10 mt-4"
                                            style={{ background: "linear-gradient(135deg, var(--terracotta), var(--temple-gold))", fontFamily: "var(--font-heading)" }}>
                                            {day.day_number}
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            {!isLeft ? (
                                                <div className="w-full glass-card rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow" style={{ maxWidth: "24rem", minWidth: "18rem" }}>
                                                    <DayCard day={day} currency={trail.currency} />
                                                </div>
                                            ) : <div />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

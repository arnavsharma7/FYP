"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getExperiences } from "@/lib/api";
import { fallbackExperiences } from "@/lib/fallbackData";

interface Experience {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    category: string;
    price_per_person: number;
    currency: string;
    duration_hours: number;
    location_name: string;
    district: string;
    is_verified: boolean;
    avg_rating: number;
    total_reviews: number;
    total_bookings: number;
    community_impact_score: number;
    thumbnail?: string | null;
    images?: string[];
    panorama_images?: string[];
    street_view_url?: string | null;
    amenities: string[];
    languages: string[];
}

const categories = [
    { id: "all", label: "All Experiences", icon: "✨" },
    { id: "homestay", label: "Homestays", icon: "🏡" },
    { id: "guide", label: "Local Guides", icon: "🧭" },
    { id: "workshop", label: "Workshops", icon: "🎨" },
    { id: "heritage_site", label: "Heritage Sites", icon: "🏛️" },
];

const sortOptions = [
    { value: "rating", label: "Top Rated" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
];

function getCategoryBadgeClass(category: string) {
    const map: Record<string, string> = {
        homestay: "badge-homestay",
        guide: "badge-guide",
        workshop: "badge-workshop",
        heritage_site: "badge-heritage",
    };
    return map[category] || "badge-heritage";
}

function formatDuration(hours: number): string {
    if (hours >= 48) return `${Math.round(hours / 24)} Days`;
    return `${hours} Hours`;
}

function getCategoryGradient(category: string) {
    if (category === "homestay") return "linear-gradient(135deg, #8B6F47 0%, #D4A843 100%)";
    if (category === "guide") return "linear-gradient(135deg, #2D5016 0%, #4A7A2E 100%)";
    if (category === "workshop") return "linear-gradient(135deg, #8B3A6A 0%, #E8A0B5 100%)";
    return "linear-gradient(135deg, #1B2A4A 0%, #2A3F6E 100%)";
}

function getCategoryIcon(category: string) {
    if (category === "homestay") return "🏡";
    if (category === "guide") return "🧭";
    if (category === "workshop") return "🎨";
    return "🏛️";
}

export default function MarketplacePage() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [sortBy, setSortBy] = useState("rating");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadExperiences() {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (activeCategory !== "all") params.set("category", activeCategory);
            if (sortBy) params.set("sort", sortBy);
            if (searchQuery) params.set("search", searchQuery);

            const res = await getExperiences(params.toString());
            if (Array.isArray(res?.data)) {
                setExperiences(res.data);
            } else {
                const fallback = fallbackExperiences
                    .filter(e => activeCategory === "all" || e.category === activeCategory)
                    .filter(e => !searchQuery ||
                        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.district.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                        if (sortBy === "price_low") return a.price_per_person - b.price_per_person;
                        if (sortBy === "price_high") return b.price_per_person - a.price_per_person;
                        if (sortBy === "popular") return b.total_bookings - a.total_bookings;
                        return b.avg_rating - a.avg_rating;
                    });
                setExperiences(fallback);
            }
            setIsLoading(false);
        }
        loadExperiences();
    }, [activeCategory, sortBy, searchQuery]);

    return (
        <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
            {/* Header */}
            <div className="py-12 lg:py-16" style={{ background: "var(--deep-indigo)" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-4 py-1.5 rounded-full"
                            style={{ background: "rgba(212, 168, 67, 0.15)", color: "var(--temple-gold)", fontFamily: "var(--font-heading)" }}>
                            Marketplace
                        </span>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                            style={{ fontFamily: "var(--font-heading)", color: "var(--himalayan-white)" }}>
                            Experience Marketplace
                        </h1>
                        {/* FIX: inline style bypasses Tailwind max-w + mx-auto specificity conflict */}
                        <p
                            className="text-base md:text-lg mx-auto"
                            style={{
                                color: "rgba(245, 240, 235, 0.7)",
                                maxWidth: "36rem",
                                width: "100%",
                                display: "block",
                                textAlign: "center",
                            }}
                        >
                            Discover verified cultural experiences across Nepal — from mountain homestays to ancient artisan workshops.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
                            style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                            <span>🔍</span>
                            <input
                                type="text"
                                placeholder="Search experiences, locations..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm"
                                style={{ color: "var(--himalayan-white)" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Category Tabs & Sort */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
                                style={{
                                    background: activeCategory === cat.id ? "var(--terracotta)" : "rgba(27, 42, 74, 0.06)",
                                    color: activeCategory === cat.id ? "white" : "var(--deep-indigo)",
                                    fontFamily: "var(--font-heading)",
                                }}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="px-4 py-2 rounded-lg text-sm border outline-none"
                        style={{ borderColor: "rgba(27, 42, 74, 0.15)", fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Experience Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {experiences.map((exp, index) => {
                            const hasPanorama = Boolean(exp.panorama_images?.length);

                            return (
                                <div key={exp.id} className="glass-card rounded-2xl overflow-hidden group animate-fade-in-up"
                                    style={{ animationDelay: `${index * 80}ms` }}>
                                    {/* Card Image */}
                                    <div className="h-48 relative overflow-hidden"
                                        style={{
                                            background: getCategoryGradient(exp.category),
                                        }}
                                    >
                                        {exp.thumbnail ? (
                                            <img
                                                src={exp.thumbnail}
                                                alt={exp.title}
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 mandala-pattern opacity-15" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryBadgeClass(exp.category)}`}>
                                                {exp.category.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 right-3">
                                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                                                ⏱️ {formatDuration(exp.duration_hours)}
                                            </span>
                                        </div>
                                        {hasPanorama && (
                                            <div className="absolute bottom-3 left-3">
                                                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(27, 42, 74, 0.72)", color: "white" }}>
                                                    🌐 360 Preview
                                                </span>
                                            </div>
                                        )}
                                        {!exp.thumbnail && (
                                            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
                                                {getCategoryIcon(exp.category)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-base font-bold leading-tight line-clamp-2 group-hover:text-terracotta transition-colors flex-1"
                                                style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                                {exp.title}
                                            </h3>
                                        </div>

                                        <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--slate-medium)" }}>
                                            {exp.short_description}
                                        </p>

                                        <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "var(--warm-brown)" }}>
                                            <span>📍 {exp.location_name}</span>
                                        </div>

                                        {/* Rating & Impact */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex items-center gap-1">
                                                <span className="star-rating text-sm">⭐</span>
                                                <span className="text-sm font-bold" style={{ color: "var(--deep-indigo)" }}>{exp.avg_rating}</span>
                                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>({exp.total_reviews})</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs">💚</span>
                                                <span className="text-xs font-medium" style={{ color: "var(--forest-green)" }}>
                                                    Impact: {exp.community_impact_score}/10
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(139, 111, 71, 0.1)" }}>
                                            <div>
                                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>From </span>
                                                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>
                                                    NPR {exp.price_per_person.toLocaleString()}
                                                </span>
                                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>/person</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Link href={`/experience/${exp.id}`} className="text-xs font-medium px-3 py-2 rounded-full"
                                                style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)", fontFamily: "var(--font-heading)" }}>
                                                View Details →
                                            </Link>
                                            {hasPanorama && (
                                                <Link href={`/experience/${encodeURIComponent(exp.id)}/panorama`} className="text-xs font-medium px-3 py-2 rounded-full"
                                                    style={{ background: "var(--deep-indigo)", color: "white", fontFamily: "var(--font-heading)" }}>
                                                    Open 360°
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {experiences.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                            No experiences found
                        </h3>
                        <p className="text-sm" style={{ color: "var(--slate-medium)" }}>
                            Try adjusting your search or category filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

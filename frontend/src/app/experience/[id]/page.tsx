"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

import { createBooking, getExperience } from "@/lib/api";
import { fallbackExperiences } from "@/lib/fallbackData";
import { useUserStore } from "@/zustand/userStore";

interface ExperienceDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    short_description: string;
    category: string;
    price_per_person: number;
    currency: string;
    duration_hours: number;
    max_guests: number;
    location_name: string;
    latitude?: number;
    longitude?: number;
    district: string;
    province: string;
    amenities: string[];
    languages: string[];
    is_verified: boolean;
    avg_rating: number;
    total_reviews: number;
    total_bookings: number;
    community_impact_score: number;
    thumbnail?: string | null;
    images?: string[];
    panorama_images?: string[];
    street_view_url?: string | null;
    panorama_url?: string;
    reviews?: { id: string; rating: number; title: string; comment: string; created_at: string }[];
}

function formatDuration(hours: number): string {
    if (hours >= 48) return `${Math.round(hours / 24)} Days`;
    return `${hours} Hours`;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className="text-base" style={{ color: star <= rating ? "var(--temple-gold)" : "#ddd" }}>
                    ★
                </span>
            ))}
        </div>
    );
}

export default function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const hydrateFromStorage = useUserStore((state) => state.hydrateFromStorage);
    const isAuthenticated = useUserStore((state) => state.isAuthenticated);
    const token = useUserStore((state) => state.token);
    const [experience, setExperience] = useState<ExperienceDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [bookingDate, setBookingDate] = useState("");
    const [guests, setGuests] = useState(1);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        hydrateFromStorage();
    }, [hydrateFromStorage]);

    useEffect(() => {
        async function loadExperience() {
            setIsLoading(true);
            const res = await getExperience(id);
            if (res?.data) {
                setExperience(res.data);
            } else {
                const fb = fallbackExperiences.find(e => e.id === id) as unknown as ExperienceDetail;
                if (fb) setExperience({ ...fb, description: fb.short_description, max_guests: 10, province: "", reviews: [] });
            }
            setIsLoading(false);
        }
        loadExperience();
    }, [id]);

    const handleBooking = async () => {
        if (!experience) return;

        if (!isAuthenticated || !token) {
            toast.error("Please sign in before booking.");
            router.push("/login");
            return;
        }

        if (!bookingDate) {
            toast.error("Please select a booking date.");
            return;
        }

        setIsBookingLoading(true);
        setShowBookingSuccess(false);

        const res = await createBooking({
            experience_id: experience.id,
            booking_date: bookingDate,
            num_guests: guests,
        }, token);

        setIsBookingLoading(false);

        if (!res?.success) {
            toast.error(res?.message || "Booking request failed.");
            return;
        }

        setShowBookingSuccess(true);
        toast.success("Booking request sent.");
        setTimeout(() => setShowBookingSuccess(false), 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!experience) {
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Experience Not Found</h2>
                <Link href="/marketplace" className="btn-primary mt-4">Browse All Experiences</Link>
            </div>
        );
    }

    const getCategoryColor = () => {
        switch (experience.category) {
            case "homestay": return "linear-gradient(135deg, #8B6F47 0%, #D4A843 100%)";
            case "guide": return "linear-gradient(135deg, #2D5016 0%, #4A7A2E 100%)";
            case "workshop": return "linear-gradient(135deg, #8B3A6A 0%, #E8A0B5 100%)";
            default: return "linear-gradient(135deg, #1B2A4A 0%, #2A3F6E 100%)";
        }
    };

    const panoramaUrl = experience.panorama_images?.[0] || experience.panorama_url;
    const mapUrl = typeof experience.latitude === "number" && typeof experience.longitude === "number"
        ? `https://maps.google.com/maps?q=${experience.latitude},${experience.longitude}&z=16&output=embed`
        : "";
    const panoramaViewerUrl = `/experience/${encodeURIComponent(experience.id)}/panorama`;

    return (
        <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
            {/* Hero Banner */}
            <div className="relative h-64 sm:h-80 lg:h-96" style={{ background: getCategoryColor() }}>
                {experience.thumbnail ? (
                    <img
                        src={experience.thumbnail}
                        alt={experience.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 mandala-pattern opacity-15" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/35" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                        {!experience.thumbnail && (
                            <div className="text-7xl mb-4 opacity-30">
                                {experience.category === "homestay" ? "🏡" : experience.category === "guide" ? "🧭" : experience.category === "workshop" ? "🎨" : "🏛️"}
                            </div>
                        )}
                        {panoramaUrl && (
                            <Link href={panoramaViewerUrl} className="text-sm font-medium px-4 py-2 rounded-full inline-block mb-4 transition-opacity hover:opacity-85" style={{ background: "var(--temple-gold)", color: "var(--deep-indigo)" }}>
                                🌐 Open 360° Preview
                            </Link>
                        )}
                    </div>
                </div>
                {/* Breadcrumb */}
                <div className="absolute bottom-4 left-4 sm:left-8 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <Link href="/" className="hover:text-white">Home</Link>
                    <span>/</span>
                    <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
                    <span>/</span>
                    <span className="text-white font-medium">{experience.title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Title Section */}
                        <div className="mb-8">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${experience.category === "homestay" ? "badge-homestay" : experience.category === "guide" ? "badge-guide" : experience.category === "workshop" ? "badge-workshop" : "badge-heritage"}`}>
                                    {experience.category.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                                {experience.is_verified && <span className="verified-badge">✓ Verified</span>}
                                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(45, 80, 22, 0.1)", color: "var(--forest-green)" }}>
                                    💚 Impact: {experience.community_impact_score}/10
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                                style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                {experience.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--warm-brown)" }}>
                                <span className="flex items-center gap-1">📍 {experience.location_name}</span>
                                <span className="flex items-center gap-1">⏱️ {formatDuration(experience.duration_hours)}</span>
                                <span className="flex items-center gap-1">👤 Max {experience.max_guests} guests</span>
                                <div className="flex items-center gap-1">
                                    <StarRating rating={Math.round(experience.avg_rating)} />
                                    <span className="font-bold" style={{ color: "var(--deep-indigo)" }}>{experience.avg_rating}</span>
                                    <span>({experience.total_reviews} reviews)</span>
                                </div>
                            </div>

                            {panoramaUrl && (
                                <Link href={panoramaViewerUrl} className="btn-gold mt-5 inline-flex items-center justify-center">
                                    Open 360° Preview
                                </Link>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6" style={{ borderBottom: "2px solid rgba(27, 42, 74, 0.1)" }}>
                            {["overview", "location", "amenities", "reviews"].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className="px-5 py-3 text-sm font-medium transition-all rounded-t-lg"
                                    style={{
                                        color: activeTab === tab ? "var(--terracotta)" : "var(--slate-medium)",
                                        borderBottom: activeTab === tab ? "2px solid var(--terracotta)" : "2px solid transparent",
                                        fontFamily: "var(--font-heading)",
                                        marginBottom: "-2px",
                                    }}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === "overview" && (
                            <div className="animate-fade-in">
                                <div className="glass-card rounded-xl p-6 mb-6">
                                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                        About This Experience
                                    </h3>
                                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--slate-medium)" }}>
                                        {experience.description}
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                        Languages Spoken
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {experience.languages.map(lang => (
                                            <span key={lang} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(27, 42, 74, 0.06)", color: "var(--deep-indigo)" }}>
                                                🗣️ {lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "amenities" && (
                            <div className="animate-fade-in glass-card rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                    What&apos;s Included
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {experience.amenities.map(amenity => (
                                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(45, 80, 22, 0.04)" }}>
                                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                style={{ background: "var(--forest-green)", color: "white" }}>✓</span>
                                            <span className="text-sm" style={{ color: "var(--deep-indigo)" }}>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "location" && (
                            <div className="animate-fade-in space-y-6">
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                        📍 Location & Interactive Map
                                    </h3>
                                    {mapUrl ? (
                                        <div className="h-96 rounded-lg overflow-hidden bg-black">
                                            <iframe
                                                src={mapUrl}
                                                title={`${experience.title} map`}
                                                className="h-full w-full border-0"
                                                loading="lazy"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-96 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-6xl mb-4">🗺️</div>
                                                <p className="text-lg font-medium" style={{ color: "var(--deep-indigo)" }}>Map unavailable</p>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm mt-4" style={{ color: "var(--slate-medium)" }}>
                                        {experience.location_name}, {experience.district}, {experience.province}
                                    </p>
                                    {typeof experience.latitude === "number" && typeof experience.longitude === "number" && (
                                        <p className="text-xs mt-2" style={{ color: "var(--slate-medium)" }}>
                                            Marker: {experience.latitude.toFixed(4)}, {experience.longitude.toFixed(4)}
                                        </p>
                                    )}
                                </div>

                                {panoramaUrl && (
                                    <div className="glass-card rounded-xl p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                                    🌐 360° Heritage Preview
                                                </h3>
                                                <p className="mt-1 text-sm" style={{ color: "var(--slate-medium)" }}>
                                                    Opens the full panorama viewer with {experience.panorama_images?.length || 1} view{(experience.panorama_images?.length || 1) > 1 ? "s" : ""}.
                                                </p>
                                            </div>
                                            <Link href={panoramaViewerUrl} className="btn-primary inline-flex items-center justify-center">
                                                Open Viewer
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="animate-fade-in space-y-4">
                                {(experience.reviews && experience.reviews.length > 0) ? (
                                    experience.reviews.map(review => (
                                        <div key={review.id} className="glass-card rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <StarRating rating={review.rating} />
                                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-sm mb-1" style={{ color: "var(--deep-indigo)" }}>{review.title}</h4>
                                            <p className="text-sm" style={{ color: "var(--slate-medium)" }}>{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="text-4xl mb-3">💬</div>
                                        <p className="text-sm" style={{ color: "var(--slate-medium)" }}>No reviews yet. Be the first to share your experience!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="glass-card rounded-2xl p-6 sticky top-24 animate-pulse-glow">
                            <div className="text-center mb-4">
                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>From</span>
                                <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>
                                    NPR {experience.price_per_person.toLocaleString()}
                                </div>
                                <span className="text-xs" style={{ color: "var(--slate-medium)" }}>per person</span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs font-semibold block mb-1" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>
                                        📅 Date
                                    </label>
                                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                                        style={{ borderColor: "rgba(27, 42, 74, 0.15)" }} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>
                                        👤 Guests
                                    </label>
                                    <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                                        className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                                        style={{ borderColor: "rgba(27, 42, 74, 0.15)" }}>
                                        {Array.from({ length: experience.max_guests }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "Guest" : "Guests"}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 mb-6 text-sm" style={{ borderTop: "1px solid rgba(139, 111, 71, 0.1)", paddingTop: "1rem" }}>
                                <div className="flex justify-between" style={{ color: "var(--slate-medium)" }}>
                                    <span>NPR {experience.price_per_person.toLocaleString()} × {guests}</span>
                                    <span>NPR {(experience.price_per_person * guests).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between" style={{ color: "var(--slate-medium)" }}>
                                    <span>Service fee</span>
                                    <span>NPR {Math.round(experience.price_per_person * guests * 0.05).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid rgba(139, 111, 71, 0.15)", color: "var(--deep-indigo)" }}>
                                    <span>Total</span>
                                    <span>NPR {Math.round(experience.price_per_person * guests * 1.05).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={isBookingLoading}
                                className="btn-gold w-full text-center disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isBookingLoading ? "Sending..." : "Book Now"}
                            </button>

                            {panoramaUrl && (
                                <Link href={panoramaViewerUrl} className="btn-primary mt-3 block w-full text-center">
                                    Open 360° Preview
                                </Link>
                            )}

                            {showBookingSuccess && (
                                <div className="mt-4 p-3 rounded-lg text-center text-sm animate-fade-in" style={{ background: "rgba(45, 80, 22, 0.1)", color: "var(--forest-green)" }}>
                                    ✅ Booking request sent! Check your dashboard for confirmation.
                                </div>
                            )}

                            {/* Community Impact */}
                            <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(45, 80, 22, 0.06)", border: "1px solid rgba(45, 80, 22, 0.1)" }}>
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2"
                                    style={{ color: "var(--forest-green)", fontFamily: "var(--font-heading)" }}>
                                    💚 Community Impact
                                </h4>
                                <p className="text-xs" style={{ color: "var(--slate-medium)" }}>
                                    72% of your payment goes directly to local families and communities. This experience has supported {experience.total_bookings}+ travelers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

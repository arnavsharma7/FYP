"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateTrail } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

function DayCard({ day, getCategoryBadge }: { day: TrailDay; getCategoryBadge: (cat: string) => string }) {
    return (
        <div style={{ width: "100%", minWidth: 0, overflowWrap: "break-word" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider min-w-0" style={{ color: "var(--terracotta)" }}>
                    📍 {day.location}
                </div>
                {day.experience && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 ${getCategoryBadge(day.experience.category)}`}>
                        {day.experience.category.replace("_", " ")}
                    </span>
                )}
            </div>

            <h3 className="text-lg font-bold mb-2 text-slate-800 break-words" style={{ fontFamily: "var(--font-heading)", lineHeight: 1.35 }}>
                {day.title}
            </h3>

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

            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(139, 111, 71, 0.1)" }}>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Daily Estimate</span>
                    <span className="text-sm font-bold text-gray-900">NPR {day.estimated_cost?.toLocaleString()}</span>
                </div>
                {day.experience && (
                    <Link
                        href={`/experience/${day.experience.id}`}
                        className="flex items-center gap-1 text-xs font-bold transition-colors"
                        style={{ color: "var(--terracotta)" }}
                    >
                        Explore ›
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

const interests = [
    { id: "Culture", icon: "🏛️", label: "Culture & Heritage", desc: "UNESCO sites, temples, ancient cities" },
    { id: "Trekking", icon: "🥾", label: "Trekking & Hiking", desc: "Himalayan trails, mountain passes" },
    { id: "Food", icon: "🍜", label: "Food & Cuisine", desc: "Cooking classes, food tours, local cuisine" },
    { id: "Spirituality", icon: "🕉️", label: "Spirituality & Wellness", desc: "Meditation, yoga, monasteries" },
    { id: "Adventure", icon: "⛰️", label: "Adventure Sports", desc: "Rafting, paragliding, climbing" },
];

const travelStyles = [
    { id: "Cultural Explorer", icon: "🎭", label: "Cultural Explorer" },
    { id: "Active Adventurer", icon: "🏔️", label: "Active Adventurer" },
    { id: "Spiritual Seeker", icon: "🧘", label: "Spiritual Seeker" },
    { id: "Food Enthusiast", icon: "🍽️", label: "Food Enthusiast" },
    { id: "Budget Traveler", icon: "🎒", label: "Budget Traveler" },
    { id: "Luxury Explorer", icon: "✨", label: "Luxury Explorer" },
];

interface TrailDay {
    day_number: number;
    title: string;
    description: string;
    location: string;
    estimated_cost: number;
    planning_reason?: string;
    experience?: {
        id: string;
        title: string;
        category: string;
        avg_rating: number;
        price_per_person: number;
    } | null;
}

interface GeneratedTrail {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration_days: number;
    total_cost_estimate: number;
    currency: string;
    interests: string[];
    travel_style: string;
    days: TrailDay[];
}

export default function TrailBuilderPage() {
    const { hasHydrated, hydrateFromStorage, token } = useAuthStore();
    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [duration, setDuration] = useState(5);
    const [budget, setBudget] = useState(50000);
    const [travelStyle, setTravelStyle] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState("");
    const [generatedTrail, setGeneratedTrail] = useState<GeneratedTrail | null>(null);

    useEffect(() => {
        if (!hasHydrated) hydrateFromStorage();
    }, [hasHydrated, hydrateFromStorage]);

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationError("");
        try {
            const result = await generateTrail({
                interests: selectedInterests,
                duration,
                budget,
                travel_style: travelStyle,
            }, token);

            const trail = result?.data?.trail || result?.trail;

            if (!trail) {
                throw new Error(result?.message || "Planner did not return a trail");
            }

            setGeneratedTrail(trail);
            setStep(5);
        } catch (error) {
            console.error("Trail generation failed", error);
            setGenerationError("Could not create a trail from the available provider experiences. Please try a broader interest set or check that the backend is running.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getCategoryBadge = (category: string) => {
        const map: Record<string, string> = {
            homestay: "badge-homestay",
            guide: "badge-guide",
            workshop: "badge-workshop",
            heritage_site: "badge-heritage",
        };
        return map[category] || "badge-heritage";
    };

    return (
        <div className="min-h-screen pt-20" style={{ background: "var(--himalayan-cream)" }}>
            {/* Header */}
            <div className="py-12 lg:py-16" style={{ background: "var(--deep-indigo)" }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-4 py-1.5 rounded-full"
                        style={{ background: "rgba(212, 168, 67, 0.15)", color: "var(--temple-gold)", fontFamily: "var(--font-heading)" }}>
                        Provider-Powered Planner
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                        style={{ fontFamily: "var(--font-heading)", color: "var(--himalayan-white)" }}>
                        Build Your Heritage Trail
                    </h1>
                    {/* FIX: inline style maxWidth + width bypasses Tailwind specificity conflict */}
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
                        Tell us your interests and we&apos;ll build a saved route from approved provider experiences and proven trail templates.
                    </p>

                    {/* Progress Steps */}
                    {step < 5 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                        style={{
                                            background: s <= step ? "var(--temple-gold)" : "rgba(255,255,255,0.1)",
                                            color: s <= step ? "var(--deep-indigo)" : "rgba(255,255,255,0.4)",
                                            fontFamily: "var(--font-heading)",
                                        }}>
                                        {s}
                                    </div>
                                    {s < 4 && (
                                        <div className="w-8 h-0.5" style={{ background: s < step ? "var(--temple-gold)" : "rgba(255,255,255,0.1)" }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Step 1: Interests */}
                {step === 1 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                            What interests you most?
                        </h2>
                        <p className="text-sm mb-8" style={{ color: "var(--slate-medium)" }}>Select one or more interests to personalize your trail.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {interests.map(interest => (
                                <button
                                    key={interest.id}
                                    onClick={() => toggleInterest(interest.id)}
                                    className="glass-card rounded-xl p-6 text-left transition-all"
                                    style={{
                                        borderColor: selectedInterests.includes(interest.id) ? "var(--terracotta)" : undefined,
                                        borderWidth: selectedInterests.includes(interest.id) ? "2px" : undefined,
                                        background: selectedInterests.includes(interest.id) ? "rgba(196, 90, 60, 0.05)" : undefined,
                                    }}
                                >
                                    <div className="text-3xl mb-3">{interest.icon}</div>
                                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                        {interest.label}
                                    </h3>
                                    <p className="text-xs" style={{ color: "var(--slate-medium)" }}>{interest.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => setStep(2)} disabled={selectedInterests.length === 0}
                                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                                Next: Duration →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Duration */}
                {step === 2 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                            How many days?
                        </h2>
                        <p className="text-sm mb-8" style={{ color: "var(--slate-medium)" }}>Choose your ideal trip duration.</p>

                        <div className="glass-card rounded-2xl p-8">
                            <div className="text-center mb-6">
                                <span className="text-6xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>
                                    {duration}
                                </span>
                                <span className="text-2xl font-light ml-2" style={{ color: "var(--slate-medium)" }}>days</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="15"
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                                className="w-full h-2 rounded-lg cursor-pointer"
                                style={{ accentColor: "var(--terracotta)" }}
                            />
                            <div className="flex justify-between text-xs mt-2" style={{ color: "var(--slate-medium)" }}>
                                <span>2 days</span><span>1 week</span><span>10 days</span><span>15 days</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={() => setStep(1)} className="text-sm font-medium" style={{ color: "var(--terracotta)" }}>← Back</button>
                            <button onClick={() => setStep(3)} className="btn-primary">Next: Budget →</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Budget */}
                {step === 3 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                            What&apos;s your budget?
                        </h2>
                        <p className="text-sm mb-8" style={{ color: "var(--slate-medium)" }}>Set your total per-person budget in Nepali Rupees.</p>

                        <div className="glass-card rounded-2xl p-8">
                            <div className="text-center mb-6">
                                <span className="text-lg" style={{ color: "var(--slate-medium)" }}>NPR</span>
                                <span className="text-5xl font-bold ml-2" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>
                                    {budget.toLocaleString()}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="10000"
                                max="200000"
                                step="5000"
                                value={budget}
                                onChange={e => setBudget(Number(e.target.value))}
                                className="w-full h-2 rounded-lg cursor-pointer"
                                style={{ accentColor: "var(--terracotta)" }}
                            />
                            <div className="flex justify-between text-xs mt-2" style={{ color: "var(--slate-medium)" }}>
                                <span>₨10K</span><span>₨50K</span><span>₨100K</span><span>₨200K</span>
                            </div>
                            <p className="text-center text-xs mt-4" style={{ color: "var(--warm-brown)" }}>
                                ≈ ${Math.round(budget / 133)} USD per person
                            </p>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={() => setStep(2)} className="text-sm font-medium" style={{ color: "var(--terracotta)" }}>← Back</button>
                            <button onClick={() => setStep(4)} className="btn-primary">Next: Style →</button>
                        </div>
                    </div>
                )}

                {/* Step 4: Travel Style */}
                {step === 4 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                            Your travel style?
                        </h2>
                        <p className="text-sm mb-8" style={{ color: "var(--slate-medium)" }}>This helps us match the right experiences for you.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {travelStyles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setTravelStyle(style.id)}
                                    className="glass-card rounded-xl p-6 text-center transition-all"
                                    style={{
                                        borderColor: travelStyle === style.id ? "var(--terracotta)" : undefined,
                                        borderWidth: travelStyle === style.id ? "2px" : undefined,
                                        background: travelStyle === style.id ? "rgba(196, 90, 60, 0.05)" : undefined,
                                    }}
                                >
                                    <div className="text-3xl mb-2">{style.icon}</div>
                                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                        {style.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button onClick={() => setStep(3)} className="text-sm font-medium" style={{ color: "var(--terracotta)" }}>← Back</button>
                            <button
                                onClick={handleGenerate}
                                disabled={!travelStyle || isGenerating}
                                className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="spinner !w-5 !h-5 !border-2" /> Building from live experiences...
                                    </>
                                ) : (
                                    "🏔️ Build & Save My Trail"
                                )}
                            </button>
                        </div>

                        {generationError && (
                            <div className="mt-5 rounded-xl px-4 py-3 text-sm"
                                style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)", border: "1px solid rgba(196, 90, 60, 0.25)" }}>
                                {generationError}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Generated Itinerary */}
                {step === 5 && generatedTrail && (
                    <div className="animate-fade-in-up" style={{ width: "100%", maxWidth: "none" }}>
                        {/* Header */}
                        <div className="text-center mb-10" style={{ width: "100%", maxWidth: "none" }}>
                            <div className="text-4xl mb-3">🎉</div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                {generatedTrail.title}
                            </h2>
                            <p
                                className="text-sm mx-auto"
                                style={{
                                    color: "var(--slate-medium)",
                                    width: "100%",
                                    maxWidth: "36rem",
                                    display: "block",
                                    textAlign: "center",
                                    lineHeight: 1.6,
                                }}
                            >
                                {generatedTrail.description}
                            </p>
                            <p className="text-xs mt-3" style={{ color: "var(--warm-brown)", width: "100%", maxWidth: "none", display: "block" }}>
                                Saved trail ID: {generatedTrail.id}
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 mt-6" style={{ width: "100%" }}>
                                <div className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(196, 90, 60, 0.1)", color: "var(--terracotta)", fontFamily: "var(--font-heading)" }}>
                                    📅 {generatedTrail.duration_days} Days
                                </div>
                                <div className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(45, 80, 22, 0.1)", color: "var(--forest-green)", fontFamily: "var(--font-heading)" }}>
                                    💰 NPR {generatedTrail.total_cost_estimate.toLocaleString()}
                                </div>
                                <div className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(212, 168, 67, 0.1)", color: "var(--warm-brown)", fontFamily: "var(--font-heading)" }}>
                                    {generatedTrail.difficulty.charAt(0).toUpperCase() + generatedTrail.difficulty.slice(1)}
                                </div>
                            </div>
                        </div>

                        {/* Gemini-style alternating timeline */}
                        <div className="relative" style={{ width: "100%", maxWidth: "none" }}>
                            {/* Center spine */}
                            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                                style={{ background: "linear-gradient(to bottom, var(--temple-gold), var(--terracotta), transparent)" }} />

                            <div className="space-y-8" style={{ width: "100%" }}>
                                {generatedTrail.days.map((day, index) => {
                                    const isLeft = index % 2 === 0;
                                    return (
                                        <div
                                            key={day.day_number}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${index * 80}ms`, width: "100%" }}
                                        >
                                            {/* Mobile layout (stacked) */}
                                            <div className="flex gap-4 md:hidden">
                                                <div className="flex-shrink-0 flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow z-10"
                                                        style={{ background: "linear-gradient(135deg, var(--terracotta), var(--temple-gold))", fontFamily: "var(--font-heading)" }}>
                                                        {day.day_number}
                                                    </div>
                                                    {index < generatedTrail.days.length - 1 && (
                                                        <div className="w-0.5 flex-1 mt-2" style={{ background: "linear-gradient(to bottom, var(--temple-gold), transparent)", minHeight: "2rem" }} />
                                                    )}
                                                </div>
                                                <div className="flex-1 glass-card rounded-xl p-5 mb-2 min-w-0" style={{ width: "100%" }}>
                                                    <DayCard day={day} getCategoryBadge={getCategoryBadge} />
                                                </div>
                                            </div>

                                            {/* Desktop alternating layout */}
                                            <div
                                                className="hidden md:grid items-start"
                                                style={{
                                                    width: "100%",
                                                    gridTemplateColumns: "minmax(0, 1fr) 2.5rem minmax(0, 1fr)",
                                                    columnGap: "2rem",
                                                }}
                                            >
                                                {/* Left side */}
                                                <div className="flex justify-end" style={{ minWidth: 0 }}>
                                                    {isLeft ? (
                                                        <div className="w-full glass-card rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow" style={{ maxWidth: "24rem", minWidth: "18rem" }}>
                                                            <DayCard day={day} getCategoryBadge={getCategoryBadge} />
                                                        </div>
                                                    ) : <div />}
                                                </div>

                                                {/* Center dot */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow z-10 mt-4"
                                                    style={{ background: "linear-gradient(135deg, var(--terracotta), var(--temple-gold))", fontFamily: "var(--font-heading)" }}>
                                                    {day.day_number}
                                                </div>

                                                {/* Right side */}
                                                <div style={{ minWidth: 0 }}>
                                                    {!isLeft ? (
                                                        <div className="w-full glass-card rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow" style={{ maxWidth: "24rem", minWidth: "18rem" }}>
                                                            <DayCard day={day} getCategoryBadge={getCategoryBadge} />
                                                        </div>
                                                    ) : <div />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="glass-card rounded-2xl p-6 mt-12" style={{ width: "100%", maxWidth: "none" }}>
                            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>
                                Cost Estimation
                            </h3>
                            <div className="space-y-2" style={{ width: "100%" }}>
                                {generatedTrail.days.map(day => (
                                    <div key={day.day_number} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm py-1" style={{ borderBottom: "1px solid rgba(139, 111, 71, 0.08)", width: "100%" }}>
                                        <span className="min-w-0" style={{ color: "var(--slate-medium)", overflowWrap: "break-word" }}>Day {day.day_number}: {day.title.substring(0, 40)}...</span>
                                        <span className="font-medium shrink-0" style={{ color: "var(--deep-indigo)" }}>NPR {day.estimated_cost?.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-base font-bold pt-3" style={{ borderTop: "2px solid var(--terracotta)", width: "100%" }}>
                                    <span style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>Total Estimated Cost</span>
                                    <span className="shrink-0" style={{ color: "var(--terracotta)", fontFamily: "var(--font-heading)" }}>NPR {generatedTrail.total_cost_estimate.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                            <button onClick={() => { setStep(1); setGeneratedTrail(null); }} className="btn-primary">
                                🔄 Build Another Trail
                            </button>
                            <Link href="/marketplace" className="btn-gold text-center">
                                Browse All Experiences
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    AlertTriangle,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    ImageIcon,
    Languages,
    MapPin,
    Search,
    ShieldCheck,
    Trash2,
    Users,
    X,
    XCircle,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    deleteAdminExperience,
    getAdminAnalytics,
    getAdminExperiences,
    getAdminSummary,
    getAdminUsers,
    updateExperienceApproval,
} from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const queryClient = new QueryClient();
const USER_LIMIT = 10;
const EXPERIENCE_LIMIT = 10;
const REFRESH_MS = 15000;

type Pagination = {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    next_offset: number | null;
    has_previous: boolean;
    previous_offset: number;
};

type AdminSummary = {
    stats: {
        total_users: number;
        providers: number;
        tourists: number;
        total_experiences: number;
        pending_experiences: number;
        approved_experiences: number;
        total_bookings: number;
        revenue_mtd: number;
        currency: string;
    };
    recent_activity: Array<{
        type: string;
        action: string;
        detail: string;
        created_at: string;
    }>;
};

type AdminUser = {
    id: string;
    full_name: string;
    email: string;
    role: "tourist" | "provider" | "admin";
    phone?: string | null;
    location?: string | null;
    is_verified: boolean;
    joined_at: string;
    counts: {
        experiences: number;
        bookings: number;
        reviews: number;
    };
    latest_booking?: {
        created_at: string;
        booking_date: string;
        status: string;
        total_amount: number;
        currency: string;
        experience?: { id: string; title: string } | null;
    } | null;
};

type AdminExperience = {
    id: string;
    provider_id: string;
    title: string;
    description: string;
    short_description: string;
    category: string;
    price_per_person: number;
    currency: string;
    duration_hours: number;
    max_guests: number;
    location_name: string;
    latitude: number;
    longitude: number;
    district: string;
    province: string;
    thumbnail?: string | null;
    images: string[];
    panorama_images: string[];
    street_view_url?: string | null;
    amenities: string[];
    languages: string[];
    approval_status: "PENDING" | "APPROVED" | "REJECTED";
    is_verified: boolean;
    avg_rating: number;
    total_bookings: number;
    total_reviews: number;
    community_impact_score: number;
    created_at: string;
    updated_at: string;
    provider?: {
        id: string;
        full_name: string;
        email: string;
    } | null;
    counts: {
        bookings: number;
        reviews: number;
    };
};

type AdminAnalytics = {
    daily: Array<{
        date: string;
        users: number;
        experiences: number;
        bookings: number;
        revenue: number;
    }>;
    users_by_role: Array<{ role: string; count: number }>;
    experiences_by_status: Array<{ status: string; count: number }>;
    experiences_by_category: Array<{ category: string; count: number }>;
};

type ConfirmationAction = {
    type: "APPROVE" | "REJECT" | "DELETE";
    experience: AdminExperience;
} | null;

function relativeTime(value?: string | null) {
    if (!value) return "never";

    const diffMs = Date.now() - new Date(value).getTime();
    if (Number.isNaN(diffMs)) return "unknown";

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
}

function formatMoney(value = 0, currency = "NPR") {
    return `${currency} ${Math.round(value).toLocaleString()}`;
}

function pageLabel(pagination?: Pagination) {
    if (!pagination || pagination.total === 0) return "0 of 0";

    const start = pagination.offset + 1;
    const end = Math.min(pagination.offset + pagination.limit, pagination.total);
    return `${start}-${end} of ${pagination.total}`;
}

function roleColor(role: string) {
    if (role === "admin") return { bg: "rgba(27, 42, 74, 0.1)", text: "var(--deep-indigo)" };
    if (role === "provider") return { bg: "rgba(45, 80, 22, 0.1)", text: "var(--forest-green)" };
    return { bg: "rgba(212, 168, 67, 0.12)", text: "var(--warm-brown)" };
}

function statusColor(status: string) {
    if (status === "APPROVED" || status === "approved") return { bg: "rgba(45, 80, 22, 0.1)", text: "var(--forest-green)" };
    if (status === "REJECTED" || status === "rejected") return { bg: "rgba(196, 90, 60, 0.12)", text: "var(--terracotta)" };
    return { bg: "rgba(212, 168, 67, 0.14)", text: "var(--warm-brown)" };
}

function StatusPill({ status }: { status: string }) {
    const colors = statusColor(status);

    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ background: colors.bg, color: colors.text }}>
            {status.toLowerCase()}
        </span>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: ReactNode; color: string }) {
    return (
        <div className="glass-card group rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}18`, color }}>{icon}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>{label}</div>
        </div>
    );
}

function EmptyState({ title, message }: { title: string; message: string }) {
    return (
        <div className="text-center py-14">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(27, 42, 74, 0.06)", color: "var(--deep-indigo)" }}>
                <ImageIcon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{title}</h3>
            <p className="text-sm" style={{ color: "var(--slate-medium)" }}>{message}</p>
        </div>
    );
}

function PaginationControls({ pagination, onPage }: { pagination?: Pagination; onPage: (offset: number) => void }) {
    return (
        <div className="flex items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "rgba(27, 42, 74, 0.08)" }}>
            <button
                disabled={!pagination?.has_previous}
                onClick={() => onPage(pagination?.previous_offset || 0)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "rgba(27, 42, 74, 0.08)", color: "var(--deep-indigo)" }}
            >
                <ChevronLeft size={16} /> Previous
            </button>
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.65)", color: "var(--slate-medium)" }}>
                {pageLabel(pagination)}
            </span>
            <button
                disabled={!pagination?.has_next}
                onClick={() => onPage(pagination?.next_offset || 0)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--deep-indigo)", color: "white" }}
            >
                Next <ChevronRight size={16} />
            </button>
        </div>
    );
}

function Modal({ open, title, children, footer, onClose }: { open: boolean; title: string; children: ReactNode; footer?: ReactNode; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm" aria-label="Close dialog" onClick={onClose} />
            <div className="relative max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-3xl shadow-2xl" style={{ background: "var(--himalayan-cream)" }}>
                <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "rgba(27, 42, 74, 0.1)" }}>
                    <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>{title}</h2>
                    <button onClick={onClose} className="rounded-full p-2 transition-all hover:bg-black/5" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="max-h-[78vh] overflow-y-auto px-6 py-5">{children}</div>
                {footer && <div className="border-t px-6 py-4" style={{ borderColor: "rgba(27, 42, 74, 0.1)", background: "rgba(255,255,255,0.45)" }}>{footer}</div>}
            </div>
        </div>
    );
}

function ConfirmDialog({ action, pending, onClose, onConfirm }: { action: ConfirmationAction; pending: boolean; onClose: () => void; onConfirm: () => void }) {
    const copy = {
        APPROVE: {
            title: "Approve experience",
            message: "This experience will become visible to travelers and usable by the recommendation planner.",
            button: "Approve",
            color: "var(--forest-green)",
            icon: <CheckCircle2 size={22} />,
        },
        REJECT: {
            title: "Reject experience",
            message: "This keeps the experience hidden from travelers until the provider improves it.",
            button: "Reject",
            color: "var(--warm-brown)",
            icon: <XCircle size={22} />,
        },
        DELETE: {
            title: "Delete experience",
            message: "This permanently removes the experience and related bookings/reviews. Use this only for invalid or unsafe content.",
            button: "Delete",
            color: "var(--terracotta)",
            icon: <Trash2 size={22} />,
        },
    } as const;

    if (!action) return null;

    const item = copy[action.type];

    return (
        <Modal
            open={Boolean(action)}
            title={item.title}
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} disabled={pending} className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40" style={{ background: "rgba(27, 42, 74, 0.08)", color: "var(--deep-indigo)" }}>Cancel</button>
                    <button onClick={onConfirm} disabled={pending} className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: item.color }}>{pending ? "Working..." : item.button}</button>
                </div>
            }
        >
            <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${item.color}18`, color: item.color }}>{item.icon}</div>
                <div>
                    <h3 className="font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>{action.experience.title}</h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--slate-medium)" }}>{item.message}</p>
                </div>
            </div>
        </Modal>
    );
}

function MediaTile({ url, label }: { url?: string | null; label: string }) {
    if (!url) {
        return (
            <div className="flex h-32 items-center justify-center rounded-2xl border text-xs" style={{ borderColor: "rgba(27,42,74,0.1)", color: "var(--slate-medium)" }}>
                No {label}
            </div>
        );
    }

    return (
        <div className="h-32 rounded-2xl bg-cover bg-center shadow-inner" style={{ backgroundImage: `url(${url})` }} aria-label={label} />
    );
}

function ExperienceDetailModal({ experience, onClose, onAction }: { experience: AdminExperience | null; onClose: () => void; onAction: (action: ConfirmationAction) => void }) {
    const media = experience ? [experience.thumbnail, ...(experience.images || [])].filter(Boolean) as string[] : [];

    return (
        <Modal
            open={Boolean(experience)}
            title="Experience verification dossier"
            onClose={onClose}
            footer={experience && (
                <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => onAction({ type: "APPROVE", experience })} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "var(--forest-green)" }}><CheckCircle2 size={16} /> Approve</button>
                    <button onClick={() => onAction({ type: "REJECT", experience })} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "rgba(212, 168, 67, 0.16)", color: "var(--warm-brown)" }}><XCircle size={16} /> Reject</button>
                    <button onClick={() => onAction({ type: "DELETE", experience })} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "rgba(196, 90, 60, 0.14)", color: "var(--terracotta)" }}><Trash2 size={16} /> Delete</button>
                </div>
            )}
        >
            {experience && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="min-h-72 overflow-hidden rounded-3xl bg-cover bg-center shadow-inner" style={{ backgroundImage: experience.thumbnail ? `linear-gradient(180deg, rgba(27,42,74,0.1), rgba(27,42,74,0.55)), url(${experience.thumbnail})` : "linear-gradient(135deg, rgba(27,42,74,0.12), rgba(212,168,67,0.18))" }}>
                            <div className="flex h-full min-h-72 flex-col justify-end p-6 text-white">
                                <StatusPill status={experience.approval_status} />
                                <h3 className="mt-3 text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{experience.title}</h3>
                                <p className="mt-2 text-sm text-white/80">{experience.short_description}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoBlock label="Provider" value={experience.provider?.full_name || "Unknown"} />
                            <InfoBlock label="Price" value={formatMoney(experience.price_per_person, experience.currency)} />
                            <InfoBlock label="Duration" value={`${experience.duration_hours} hours`} />
                            <InfoBlock label="Max guests" value={String(experience.max_guests)} />
                            <InfoBlock label="Rating" value={`${experience.avg_rating || 0}/5`} />
                            <InfoBlock label="Impact" value={`${experience.community_impact_score || 0}/10`} />
                        </div>
                    </div>

                    <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.52)" }}>
                        <h4 className="mb-2 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>Full description</h4>
                        <p className="text-sm leading-6" style={{ color: "var(--slate-medium)" }}>{experience.description}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl p-5 lg:col-span-1" style={{ background: "rgba(255,255,255,0.52)" }}>
                            <div className="mb-3 flex items-center gap-2 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}><MapPin size={18} /> Location</div>
                            <p className="text-sm font-semibold" style={{ color: "var(--deep-indigo)" }}>{experience.location_name}</p>
                            <p className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>{experience.district}, {experience.province}</p>
                            <p className="text-xs mt-3" style={{ color: "var(--warm-brown)" }}>{experience.latitude}, {experience.longitude}</p>
                        </div>
                        <div className="rounded-3xl p-5 lg:col-span-2" style={{ background: "rgba(255,255,255,0.52)" }}>
                            <div className="mb-3 flex items-center gap-2 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}><Languages size={18} /> Metadata</div>
                            <div className="flex flex-wrap gap-2">
                                {[experience.category.replace("_", " "), ...experience.languages, ...experience.amenities].filter(Boolean).map((item) => (
                                    <span key={item} className="rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ background: "rgba(27, 42, 74, 0.07)", color: "var(--deep-indigo)" }}>{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-3 flex items-center gap-2 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}><ImageIcon size={18} /> Provider media</h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {media.length ? media.slice(0, 8).map((url, index) => <MediaTile key={`${url}-${index}`} url={url} label={`experience image ${index + 1}`} />) : <MediaTile label="image" />}
                        </div>
                    </div>

                    {Boolean(experience.panorama_images?.length) && (
                        <div>
                            <h4 className="mb-3 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>Panorama previews</h4>
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {experience.panorama_images.slice(0, 4).map((url) => (
                                    <iframe key={url} src={url} className="h-64 w-full rounded-2xl border-0 shadow-inner" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                ))}
                            </div>
                        </div>
                    )}

                    {experience.street_view_url && (
                        <div>
                            <h4 className="mb-3 font-bold" style={{ color: "var(--deep-indigo)", fontFamily: "var(--font-heading)" }}>Street view / map embed</h4>
                            <iframe src={experience.street_view_url} className="h-72 w-full rounded-2xl border-0 shadow-inner" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.62)" }}>
            <div className="text-xs" style={{ color: "var(--slate-medium)" }}>{label}</div>
            <div className="mt-1 text-sm font-bold" style={{ color: "var(--deep-indigo)" }}>{value}</div>
        </div>
    );
}

function AdminPanelContent() {
    const { hasHydrated, hydrateFromStorage, token, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("overview");
    const [userSearch, setUserSearch] = useState("");
    const [userOffset, setUserOffset] = useState(0);
    const [experienceSearch, setExperienceSearch] = useState("");
    const [experienceOffset, setExperienceOffset] = useState(0);
    const [experienceStatus, setExperienceStatus] = useState("PENDING");
    const [selectedExperience, setSelectedExperience] = useState<AdminExperience | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>(null);
    const queryClientInstance = useQueryClient();

    useEffect(() => {
        if (!hasHydrated) hydrateFromStorage();
    }, [hasHydrated, hydrateFromStorage]);

    const enabled = Boolean(token);

    const summaryQuery = useQuery({
        queryKey: ["admin-summary", token],
        queryFn: async () => {
            const res = await getAdminSummary(token as string);
            return res?.data as AdminSummary;
        },
        enabled,
        refetchInterval: REFRESH_MS,
    });

    const analyticsQuery = useQuery({
        queryKey: ["admin-analytics", token],
        queryFn: async () => {
            const res = await getAdminAnalytics(token as string, 14);
            return res?.data as AdminAnalytics;
        },
        enabled,
        refetchInterval: REFRESH_MS,
    });

    const usersQuery = useQuery({
        queryKey: ["admin-users", token, userSearch, userOffset],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: String(USER_LIMIT),
                offset: String(userOffset),
            });
            if (userSearch.trim()) params.set("search", userSearch.trim());

            const res = await getAdminUsers(token as string, params.toString());
            return res?.data as { items: AdminUser[]; pagination: Pagination };
        },
        enabled,
        refetchInterval: REFRESH_MS,
    });

    const experiencesQuery = useQuery({
        queryKey: ["admin-experiences", token, experienceSearch, experienceStatus, experienceOffset],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: String(EXPERIENCE_LIMIT),
                offset: String(experienceOffset),
            });
            if (experienceSearch.trim()) params.set("search", experienceSearch.trim());
            if (experienceStatus !== "ALL") params.set("status", experienceStatus);

            const res = await getAdminExperiences(token as string, params.toString());
            return res?.data as { items: AdminExperience[]; pagination: Pagination };
        },
        enabled,
        refetchInterval: REFRESH_MS,
    });

    const approvalMutation = useMutation({
        mutationFn: ({ experienceId, status }: { experienceId: string; status: "PENDING" | "APPROVED" | "REJECTED" }) =>
            updateExperienceApproval(token as string, experienceId, status),
        onSuccess: () => {
            queryClientInstance.invalidateQueries({ queryKey: ["admin-experiences"] });
            queryClientInstance.invalidateQueries({ queryKey: ["admin-summary"] });
            queryClientInstance.invalidateQueries({ queryKey: ["admin-analytics"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (experienceId: string) => deleteAdminExperience(token as string, experienceId),
        onSuccess: () => {
            queryClientInstance.invalidateQueries({ queryKey: ["admin-experiences"] });
            queryClientInstance.invalidateQueries({ queryKey: ["admin-summary"] });
            queryClientInstance.invalidateQueries({ queryKey: ["admin-analytics"] });
        },
    });

    const summary = summaryQuery.data;
    const analytics = analyticsQuery.data;
    const users = usersQuery.data?.items || [];
    const userPagination = usersQuery.data?.pagination;
    const experiences = experiencesQuery.data?.items || [];
    const experiencePagination = experiencesQuery.data?.pagination;
    const actionPending = approvalMutation.isPending || deleteMutation.isPending;

    const stats = useMemo(() => [
        { label: "Total Users", value: summary?.stats.total_users ?? "-", icon: <Users size={22} />, color: "#1B2A4A" },
        { label: "Pending Experiences", value: summary?.stats.pending_experiences ?? "-", icon: <ShieldCheck size={22} />, color: "#8B6F47" },
        { label: "Total Bookings", value: summary?.stats.total_bookings ?? "-", icon: <CalendarClock size={22} />, color: "#C45A3C" },
        { label: "Revenue MTD", value: summary ? formatMoney(summary.stats.revenue_mtd, summary.stats.currency) : "-", icon: <BarChart3 size={22} />, color: "#D4A843" },
    ], [summary]);

    const runConfirmedAction = async () => {
        if (!confirmationAction) return;

        if (confirmationAction.type === "DELETE") {
            await deleteMutation.mutateAsync(confirmationAction.experience.id);
            setSelectedExperience(null);
        } else {
            await approvalMutation.mutateAsync({
                experienceId: confirmationAction.experience.id,
                status: confirmationAction.type === "APPROVE" ? "APPROVED" : "REJECTED",
            });
        }

        setConfirmationAction(null);
    };

    if (hasHydrated && !token) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: "var(--himalayan-cream)" }}>
                <div className="glass-card rounded-2xl p-8 max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Admin Sign In Required</h1>
                    <p className="text-sm" style={{ color: "var(--slate-medium)" }}>Sign in with an admin account to manage users, experiences, approvals, and analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20" style={{ background: "radial-gradient(circle at top left, rgba(212,168,67,0.18), transparent 32rem), var(--himalayan-cream)" }}>
            <div className="py-10" style={{ background: "linear-gradient(135deg, #111827, var(--deep-indigo))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(212, 168, 67, 0.18)", color: "var(--temple-gold)" }}><ShieldCheck size={26} /></div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--himalayan-white)" }}>Admin Control Room</h1>
                                <p className="text-sm" style={{ color: "rgba(245, 240, 235, 0.65)" }}>Live moderation dashboard {user?.email ? `• ${user.email}` : ""}</p>
                            </div>
                        </div>
                        <div className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: "rgba(245, 240, 235, 0.08)", color: "var(--temple-gold)" }}>Auto-refresh every 15s</div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
                </div>

                <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(27,42,74,0.08)" }}>
                    {["overview", "users", "content", "analytics"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="rounded-xl px-5 py-3 text-sm font-bold capitalize transition-all whitespace-nowrap"
                            style={{
                                background: activeTab === tab ? "var(--deep-indigo)" : "transparent",
                                color: activeTab === tab ? "white" : "var(--slate-medium)",
                                fontFamily: "var(--font-heading)",
                            }}>
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Platform Mix</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.users_by_role || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
                                        <XAxis dataKey="role" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#C45A3C" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Recent Activity</h3>
                            <div className="space-y-3">
                                {(summary?.recent_activity || []).map((item, idx) => (
                                    <div key={`${item.type}-${idx}`} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-white/50">
                                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(212,168,67,0.15)", color: "var(--warm-brown)" }}><AlertTriangle size={14} /></div>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: "var(--deep-indigo)" }}>{item.action}</div>
                                            <div className="text-xs" style={{ color: "var(--slate-medium)" }}>{item.detail} • {relativeTime(item.created_at)}</div>
                                        </div>
                                    </div>
                                ))}
                                {!summary?.recent_activity?.length && <EmptyState title="No activity yet" message="New users, bookings, and experiences will appear here." />}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="glass-card rounded-2xl p-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>User Directory</h3>
                                <p className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>Showing 10 users at a time with offset pagination.</p>
                            </div>
                            <label className="flex items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2 md:w-96" style={{ borderColor: "rgba(27, 42, 74, 0.12)" }}>
                                <Search size={16} style={{ color: "var(--slate-medium)" }} />
                                <input type="text" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserOffset(0); }} placeholder="Search users by name, email, location..." className="w-full bg-transparent text-sm outline-none" />
                            </label>
                        </div>

                        {usersQuery.isLoading ? <div className="spinner mx-auto my-12" /> : users.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[920px] text-sm">
                                    <thead>
                                        <tr style={{ color: "var(--slate-medium)", borderBottom: "1px solid rgba(27,42,74,0.1)" }}>
                                            <th className="py-3 text-left font-semibold">User</th>
                                            <th className="py-3 text-left font-semibold">Role</th>
                                            <th className="py-3 text-left font-semibold">Joined</th>
                                            <th className="py-3 text-left font-semibold">Latest booking</th>
                                            <th className="py-3 text-right font-semibold">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((adminUser) => {
                                            const colors = roleColor(adminUser.role);
                                            return (
                                                <tr key={adminUser.id} className="transition-all hover:bg-white/50" style={{ borderBottom: "1px solid rgba(27,42,74,0.06)" }}>
                                                    <td className="py-4 pr-4">
                                                        <div className="font-bold" style={{ color: "var(--deep-indigo)" }}>{adminUser.full_name}</div>
                                                        <div className="text-xs" style={{ color: "var(--slate-medium)" }}>{adminUser.email}</div>
                                                    </td>
                                                    <td className="py-4 pr-4"><span className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ background: colors.bg, color: colors.text }}>{adminUser.role}</span></td>
                                                    <td className="py-4 pr-4" style={{ color: "var(--warm-brown)" }}>{relativeTime(adminUser.joined_at)}</td>
                                                    <td className="py-4 pr-4" style={{ color: "var(--slate-medium)" }}>{adminUser.latest_booking ? `${adminUser.latest_booking.experience?.title || "Experience"} • ${relativeTime(adminUser.latest_booking.created_at)}` : "No bookings"}</td>
                                                    <td className="py-4 text-right" style={{ color: "var(--deep-indigo)" }}>{adminUser.counts.bookings} bookings • {adminUser.counts.experiences} listings</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState title="No users found" message="Try a different search term." />}

                        <PaginationControls pagination={userPagination} onPage={setUserOffset} />
                    </div>
                )}

                {activeTab === "content" && (
                    <div className="glass-card rounded-2xl p-6 animate-fade-in">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Content Verification</h3>
                                <p className="text-xs mt-1" style={{ color: "var(--slate-medium)" }}>Review full provider metadata, images, panorama embeds, location, and approval status.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <label className="flex items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2" style={{ borderColor: "rgba(27, 42, 74, 0.12)" }}>
                                    <Search size={16} style={{ color: "var(--slate-medium)" }} />
                                    <input type="text" value={experienceSearch} onChange={(event) => { setExperienceSearch(event.target.value); setExperienceOffset(0); }} placeholder="Search experiences..." className="bg-transparent text-sm outline-none" />
                                </label>
                                <select value={experienceStatus} onChange={(event) => { setExperienceStatus(event.target.value); setExperienceOffset(0); }} className="rounded-2xl border bg-white/70 px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(27, 42, 74, 0.12)" }}>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="ALL">All</option>
                                </select>
                            </div>
                        </div>

                        {experiencesQuery.isLoading ? <div className="spinner mx-auto my-12" /> : experiences.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead>
                                        <tr style={{ color: "var(--slate-medium)", borderBottom: "1px solid rgba(27,42,74,0.1)" }}>
                                            <th className="py-3 text-left font-semibold">Experience</th>
                                            <th className="py-3 text-left font-semibold">Provider</th>
                                            <th className="py-3 text-left font-semibold">Location</th>
                                            <th className="py-3 text-left font-semibold">Media</th>
                                            <th className="py-3 text-left font-semibold">Status</th>
                                            <th className="py-3 text-right font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {experiences.map((experience) => (
                                            <tr key={experience.id} className="transition-all hover:bg-white/50" style={{ borderBottom: "1px solid rgba(27,42,74,0.06)" }}>
                                                <td className="py-4 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-14 w-16 shrink-0 rounded-2xl bg-cover bg-center" style={{ backgroundImage: experience.thumbnail ? `url(${experience.thumbnail})` : "linear-gradient(135deg, rgba(27,42,74,0.14), rgba(212,168,67,0.18))" }} />
                                                        <div>
                                                            <div className="font-bold" style={{ color: "var(--deep-indigo)" }}>{experience.title}</div>
                                                            <div className="text-xs capitalize" style={{ color: "var(--warm-brown)" }}>{experience.category.replace("_", " ")} • {formatMoney(experience.price_per_person, experience.currency)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4" style={{ color: "var(--slate-medium)" }}>{experience.provider?.full_name || "Unknown"}<br /><span className="text-xs">{experience.provider?.email}</span></td>
                                                <td className="py-4 pr-4" style={{ color: "var(--slate-medium)" }}><span className="inline-flex items-center gap-1"><MapPin size={14} /> {experience.district}</span><br /><span className="text-xs">{experience.location_name}</span></td>
                                                <td className="py-4 pr-4" style={{ color: "var(--slate-medium)" }}>{(experience.images?.length || 0) + (experience.thumbnail ? 1 : 0)} images • {experience.panorama_images?.length || 0} panoramas</td>
                                                <td className="py-4 pr-4"><StatusPill status={experience.approval_status} /></td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setSelectedExperience(experience)} className="rounded-xl p-2 transition-all hover:bg-white" title="View dossier" style={{ color: "var(--deep-indigo)" }}><Eye size={17} /></button>
                                                        <button onClick={() => setConfirmationAction({ type: "APPROVE", experience })} className="rounded-xl p-2 transition-all hover:bg-white" title="Approve" style={{ color: "var(--forest-green)" }}><CheckCircle2 size={17} /></button>
                                                        <button onClick={() => setConfirmationAction({ type: "REJECT", experience })} className="rounded-xl p-2 transition-all hover:bg-white" title="Reject" style={{ color: "var(--warm-brown)" }}><XCircle size={17} /></button>
                                                        <button onClick={() => setConfirmationAction({ type: "DELETE", experience })} className="rounded-xl p-2 transition-all hover:bg-white" title="Delete" style={{ color: "var(--terracotta)" }}><Trash2 size={17} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState title="No experiences found" message="Change the status filter or search term." />}

                        <PaginationControls pagination={experiencePagination} onPage={setExperienceOffset} />
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Daily Platform Growth</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics?.daily || []}>
                                        <defs>
                                            <linearGradient id="experiencesFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#C45A3C" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#C45A3C" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="experiences" stroke="#C45A3C" fill="url(#experiencesFill)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="bookings" stroke="#2D5016" fill="rgba(45,80,22,0.12)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="users" stroke="#D4A843" fill="rgba(212,168,67,0.12)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Experience Status</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics?.experiences_by_status || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
                                            <XAxis dataKey="status" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#D4A843" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="glass-card rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--deep-indigo)" }}>Experience Categories</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics?.experiences_by_category || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
                                            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#1B2A4A" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ExperienceDetailModal experience={selectedExperience} onClose={() => setSelectedExperience(null)} onAction={(action) => setConfirmationAction(action)} />
            <ConfirmDialog action={confirmationAction} pending={actionPending} onClose={() => setConfirmationAction(null)} onConfirm={runConfirmedAction} />
        </div>
    );
}

export default function AdminPanelPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <AdminPanelContent />
        </QueryClientProvider>
    );
}

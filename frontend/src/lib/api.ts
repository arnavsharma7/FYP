// ============================================================
// API Client — Fetches data from the Express backend
// ============================================================

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

export async function fetchAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
    } catch {
        console.warn(`API fetch failed for ${endpoint}, using fallback data`);
        return null;
    }
}

export async function fetchAPIWithAuth(endpoint: string, token: string, options?: RequestInit) {
    return fetchAPI(endpoint, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
}

export async function fetchRootAPI(endpoint: string, options?: RequestInit) {
    return fetchAPI(endpoint, options);
}

export async function fetchRootAPIWithAuth(endpoint: string, token: string, options?: RequestInit) {
    return fetchRootAPI(endpoint, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
}

// Experiences
export const getExperiences = (params?: string) =>
    fetchAPI(`/experiences${params ? `?${params}` : ""}`);

export const getExperience = (id: string) => fetchAPI(`/experiences/${id}`);

export const getCategories = () => fetchAPI("/experiences/categories");

// Trails
export const getTrails = () => fetchAPI("/trails");

export const getFeaturedTrails = () => fetchAPI("/trails/featured");

export const getTrail = (id: string) => fetchAPI(`/trails/${id}`);

export const generateTrail = (data: {
    interests: string[];
    duration: number;
    budget: number;
    travel_style: string;
}, token?: string | null) =>
    fetchAPI("/trails/generate", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify(data),
    });

export const getMyTrails = (token: string) =>
    fetchAPIWithAuth("/trails/mine", token);

// Admin
export const getAdminSummary = (token: string) =>
    fetchAPIWithAuth("/admin/summary", token);

export const getAdminUsers = (token: string, params?: string) =>
    fetchAPIWithAuth(`/admin/users${params ? `?${params}` : ""}`, token);

export const getAdminExperiences = (token: string, params?: string) =>
    fetchAPIWithAuth(`/admin/experiences${params ? `?${params}` : ""}`, token);

export const updateExperienceApproval = (
    token: string,
    experienceId: string,
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
) =>
    fetchAPIWithAuth(`/admin/experiences/${experienceId}/approval`, token, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
    });

export const deleteAdminExperience = (token: string, experienceId: string) =>
    fetchAPIWithAuth(`/admin/experiences/${experienceId}`, token, {
        method: "DELETE",
    });

export const getAdminAnalytics = (token: string, days = 14) =>
    fetchAPIWithAuth(`/admin/analytics?days=${days}`, token);

// Impact
export const getImpactStats = () => fetchAPI("/impact/stats");

export const getImpactDistribution = () => fetchAPI("/impact/distribution");

// Auth
export const login = (email: string, password: string) =>
    fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const register = (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
}) =>
    fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });

// Bookings
export const createBooking = (data: {
    experience_id: string;
    booking_date: string;
    num_guests: number;
}, token: string) =>
    fetchAPIWithAuth("/bookings", token, {
        method: "POST",
        body: JSON.stringify(data),
    });

// Users
export const getUserDashboard = (token: string) =>
    fetchRootAPIWithAuth("/user/dashboard", token);

export const getUserTrails = (token: string) =>
    fetchRootAPIWithAuth("/user/trails", token);

export const getUserTrail = (token: string, trailId: string) =>
    fetchRootAPIWithAuth(`/user/trails/${trailId}`, token);

export const deleteUserTrail = (token: string, trailId: string) =>
    fetchRootAPIWithAuth(`/user/trails/${trailId}`, token, {
        method: "DELETE",
    });

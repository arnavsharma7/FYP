"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/zustand/userStore";
import { useRouter, useSearchParams } from "next/navigation";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth";

type UserRole = "tourist" | "provider";
type SetupProfileResponse = {
  data?: {
    accessToken?: string;
    token?: string;
    user?: {
      id?: string;
      email?: string;
      fullName?: string;
      full_name?: string;
      phone?: string | null;
      role?: UserRole | "admin";
    };
  };
};

export default function OAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("tourist");
  const [loading, setLoading] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get("token");
      const isNew = searchParams.get("isNew");

      if (!token) {
        router.replace("/login");
        return;
      }

      setOauthToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);

      if (isNew === "true") {
        setShowForm(true);
      } else {
        await useUserStore.getState().fetchMe();
        router.replace("/");
      }
    };

    run();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = oauthToken || localStorage.getItem("accessToken");

    if (!phone.trim()) {
      alert("Phone number is required");
      return;
    }

    if (!token) {
      alert("Session expired. Please login with Google again.");
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${AUTH_BASE}/setupProfile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone,
          role,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const data = (await res.json()) as SetupProfileResponse;
      const refreshedToken = data.data?.accessToken || data.data?.token;
      const updatedUser = data.data?.user;

      if (refreshedToken) {
        localStorage.setItem("token", refreshedToken);
        localStorage.setItem("accessToken", refreshedToken);
        useUserStore.getState().setAuthenticated(refreshedToken, {
          id: updatedUser?.id,
          email: updatedUser?.email,
          fullName: updatedUser?.fullName || updatedUser?.full_name,
          phone: updatedUser?.phone,
          role: updatedUser?.role,
        });
      } else {
        await useUserStore.getState().fetchMe();
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <main style={styles.page}>
        <p>Logging you in...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Complete your profile</h1>

        <p style={styles.subtitle}>
          Add your phone number and choose how you want to use the app.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Phone number
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Account type
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={styles.input}
            >
              <option value="tourist">Tourist</option>
              <option value="provider">Provider</option>
            </select>
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Saving..." : "Continue to dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },
  button: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

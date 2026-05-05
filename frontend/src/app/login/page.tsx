"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, GitBranch, Globe2, Lock, Mail } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useUserStore } from "@/zustand/userStore";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth";

type AuthResponse = {
  data?: {
    accessToken?: string;
    token?: string;
      user?: {
        id?: string;
        email?: string;
        fullName?: string;
        full_name?: string;
        phone?: string | null;
        role?: "tourist" | "provider" | "admin";
      };
      needsProfileSetup?: boolean;
    };
  message?: string;
  error?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getBearerToken(data: AuthResponse) {
  return data.data?.accessToken || data.data?.token || null;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuthenticated = useUserStore((state) => state.setAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await res.json()) as AuthResponse;

      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const bearerToken = getBearerToken(data);

      if (!bearerToken) {
        throw new Error("Login succeeded but no access token was returned");
      }

      setAuthenticated(bearerToken, {
        id: data.data?.user?.id,
        email: data.data?.user?.email || email,
        fullName:
          data.data?.user?.fullName || data.data?.user?.full_name || "Traveler",
        phone: data.data?.user?.phone,
        role: data.data?.user?.role,
      });

      toast.success("Signed in successfully");
      if (data.data?.needsProfileSetup) {
        router.push(`/oauth/success?token=${encodeURIComponent(bearerToken)}&isNew=true`);
      } else {
        router.push("/");
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const startSocialLogin = (provider: "google" | "github") => {
    window.location.href = `${AUTH_BASE}/${provider}`;
  };

  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(192,86,33,0.14),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(55,104,80,0.14),transparent_30%),linear-gradient(180deg,#f9f9ff_0%,#f0f3ff_100%)]" />
      <div className="relative mx-auto grid max-w-6xl overflow-hidden border border-outline-variant bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden min-h-[620px] flex-col justify-between bg-inverse-surface p-10 text-white lg:flex">
          <div>
            <p className="mb-6 inline-flex bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
              DISCOVERY ACCESS
            </p>
            <h1 className="max-w-md font-h1 text-h1">
              Return to the uncharted heart of Nepal.
            </h1>
          </div>
          <div className="border-l-4 border-primary-container bg-white/10 p-6 backdrop-blur-sm">
            <p className="font-body-lg text-body-lg leading-relaxed text-white/90">
              Keep building responsible trails, saving heritage experiences, and
              connecting with verified local partners.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10">
            <Link
              href="/"
              className="mb-8 inline-block font-serif text-sm uppercase tracking-widest text-primary"
            >
              Nepal Uncharted
            </Link>
            <h2 className="font-h2 text-h2 text-on-surface">Welcome back</h2>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              Sign in to continue planning sustainable heritage journeys.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => startSocialLogin("google")}
              className="flex items-center justify-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3 font-serif text-sm text-on-surface transition-all hover:border-primary hover:text-primary"
            >
              <Globe2 aria-hidden="true" size={19} strokeWidth={1.8} />
              Google
            </button>
            <button
              type="button"
              onClick={() => startSocialLogin("github")}
              className="flex items-center justify-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3 font-serif text-sm text-on-surface transition-all hover:border-primary hover:text-primary"
            >
              <GitBranch aria-hidden="true" size={19} strokeWidth={1.8} />
              GitHub
            </button>
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              or email
            </span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="border border-error-container bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block font-label-sm text-label-sm uppercase text-on-surface">
                Email
              </span>
              <div className="flex items-center border border-outline-variant bg-white px-4 transition-colors focus-within:border-primary">
                <Mail aria-hidden="true" className="text-on-surface-variant" size={19} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-none bg-transparent px-3 py-3 font-body-md text-body-md outline-none"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block font-label-sm text-label-sm uppercase text-on-surface">
                Password
              </span>
              <div className="flex items-center border border-outline-variant bg-white px-4 transition-colors focus-within:border-primary">
                <Lock aria-hidden="true" className="text-on-surface-variant" size={19} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full border-none bg-transparent px-3 py-3 font-body-md text-body-md outline-none"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-primary-container px-xl py-md font-serif text-sm uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
            </button>
          </form>

          <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
            New to Nepal Uncharted?{" "}
            <Link href="/register" className="font-semibold text-primary underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

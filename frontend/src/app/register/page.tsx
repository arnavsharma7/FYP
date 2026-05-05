"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, GitBranch, Globe2, Lock, Mail, UserRound } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth";

type AuthResponse = {
  data?: {
    accessToken?: string;
    token?: string;
    user?: {
      email?: string;
      fullName?: string;
      full_name?: string;
    };
  };
  message?: string;
  error?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          full_name: fullName,
        }),
      });

      const data = (await res.json()) as AuthResponse;

      if (!res.ok) {
        throw new Error(data.message || data.error || "Register failed");
      }

      toast.success("Account created. Please sign in.");
      router.push("/login");
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(55,104,80,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(192,86,33,0.14),transparent_32%),linear-gradient(180deg,#f9f9ff_0%,#f0f3ff_100%)]" />
      <div className="relative mx-auto grid max-w-6xl overflow-hidden border border-outline-variant bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10">
            <Link
              href="/"
              className="mb-8 inline-block font-serif text-sm uppercase tracking-widest text-primary"
            >
              Nepal Uncharted
            </Link>
            <h2 className="font-h2 text-h2 text-on-surface">Create your account</h2>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
              Join responsible explorers supporting heritage trails and local partners.
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

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="border border-error-container bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block font-label-sm text-label-sm uppercase text-on-surface">
                Full name
              </span>
              <div className="flex items-center border border-outline-variant bg-white px-4 transition-colors focus-within:border-primary">
                <UserRound aria-hidden="true" className="text-on-surface-variant" size={19} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Anjali Prajapati"
                  className="w-full border-none bg-transparent px-3 py-3 font-body-md text-body-md outline-none"
                  required
                />
              </div>
            </label>

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
                  placeholder="Create a strong password"
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
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
            </button>
          </form>

          <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden min-h-[680px] flex-col justify-between bg-inverse-surface p-10 text-white lg:flex">
          <div>
            <p className="mb-6 inline-flex bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
              COMMUNITY FIRST
            </p>
            <h1 className="max-w-md font-h1 text-h1">
              Build journeys that preserve living heritage.
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-5 backdrop-blur-sm">
              <span className="block font-h2 text-h2 text-inverse-primary">92%</span>
              <p className="mt-2 font-label-sm text-label-sm uppercase tracking-widest text-white/80">
                Local revenue retention
              </p>
            </div>
            <div className="bg-white/10 p-5 backdrop-blur-sm">
              <span className="block font-h2 text-h2 text-inverse-primary">100%</span>
              <p className="mt-2 font-label-sm text-label-sm uppercase tracking-widest text-white/80">
                Verified partners
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

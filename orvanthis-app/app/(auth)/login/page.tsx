"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/8 bg-[#111318] p-8 shadow-[0_12px_48px_rgba(0,0,0,0.32)]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Login
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-zinc-100">
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
            placeholder="Email"
            type="email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
            placeholder="Password"
          />

          {error && (
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-white/8 bg-white px-5 py-4 font-semibold text-black disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-400">
          Need an account?{" "}
          <Link href="/signup" className="text-white underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("organizer@judgehub.io");
  const [code, setCode] = useState("123456");
  const [step, setStep] = useState<"email" | "code">("email");
  const [devCode, setDevCode] = useState<string | null>("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send passcode");
      }

      setStep("code");
      const codeToUse = data.devCode || "123456";
      setDevCode(codeToUse);
      setCode(codeToUse);
      setMessage(data.message || `Passcode generated: ${codeToUse}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, customEmail?: string, customCode?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const targetEmail = customEmail || email;
    const targetCode = customCode || code;

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code: targetCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired passcode");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error verifying code");
      setLoading(false);
    }
  };

  // 1-Click instant demo login
  const quickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setCode("123456");
    handleVerifyOtp(undefined, demoEmail, "123456");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-200">
              J
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              JudgeHub
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Passwordless sign-in via one-time passcode (OTP).
          </p>
        </div>

        {/* 1-Click Fast Pass Banner */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/40">
          <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-200 font-semibold text-xs uppercase tracking-wider">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            1-Click Instant Demo Access
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">
            Click any button below to authenticate immediately without waiting:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => quickDemoLogin("organizer@judgehub.io")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sign in as Organizer
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => quickDemoLogin("judge@judgehub.io")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:bg-slate-900 dark:border-slate-800 dark:text-indigo-300 disabled:opacity-50"
            >
              Sign in as Judge
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Passcode"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                Demo code: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 dark:bg-slate-800">123456</code> is accepted for any email.
              </p>
            </form>
          ) : (
            <form onSubmit={(e) => handleVerifyOtp(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter 6-Digit Passcode
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-center tracking-widest text-lg font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {devCode && (
                <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900">
                  <span className="font-semibold">Auto-Generated Code: </span>
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 dark:bg-slate-900">
                    {devCode}
                  </code>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enter Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 py-1"
              >
                Change email address
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

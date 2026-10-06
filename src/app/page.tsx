import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { ShieldCheck, Layers, Award, Sparkles, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              JudgeHub
            </span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Sign in with OTP
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-6 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            Phase 0: Foundations Active
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            The Dynamic Judging Platform
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
            One platform where organizers describe how they want to judge, and the software
            enforces the process fairly, transparently, and in real time with cryptographic auditability.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
              >
                Enter Dashboard ({session.email})
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
              >
                Get Started with One-Time Passcode
              </Link>
            )}
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 text-left md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-4 dark:bg-indigo-950/50">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                The Dynamic Principle
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Criteria, scales, weights, stages, rubrics, and formulas are 100% data and
                configuration—never hard-coded.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4 dark:bg-emerald-950/50">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Cryptographic Audit Trail
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Append-only SHA-256 hash-chained log tracks every tenant creation, login, and
                evaluation with tamper detection.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-4 dark:bg-purple-950/50">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Pure Scoring Engine
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Zero side-effects calculation package with golden fixtures, property tests, and
                reproducible breakdowns.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        JudgeHub &copy; 2026. Built with precision and integrity.
      </footer>
    </div>
  );
}

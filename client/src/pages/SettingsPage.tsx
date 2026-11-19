import { FiMoon, FiSun, FiUser } from "react-icons/fi";
import type { AuthUser } from "../types/auth";

interface SettingsPageProps {
  user: AuthUser | null;
  isDark: boolean;
  onThemeToggle: () => void;
  onLogout: () => void;
}

export default function SettingsPage({
  user,
  isDark,
  onThemeToggle,
  onLogout,
}: SettingsPageProps) {
  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
          Your workspace
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your account details and appearance.
        </p>
      </div>
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <FiUser size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Account
              </h2>
              <p className="text-sm text-slate-500">Signed-in profile</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 dark:border-slate-800">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email address
              </dt>
              <dd className="mt-1 break-all text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Member since
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-3">
            {isDark ? (
              <FiMoon className="text-violet-600" size={20} />
            ) : (
              <FiSun className="text-amber-500" size={20} />
            )}
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Appearance
              </h2>
              <p className="text-sm text-slate-500">
                Currently using {isDark ? "dark" : "light"} theme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onThemeToggle}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-violet-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Switch to {isDark ? "light" : "dark"} theme
          </button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Session
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign out from this device. Your saved prompts remain in your
            account.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Sign out
          </button>
        </section>
      </div>
    </section>
  );
}

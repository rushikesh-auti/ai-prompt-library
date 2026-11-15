import {
  FiMenu,
  FiMoon,
  FiSearch,
  FiSun,
  FiUser,
} from "react-icons/fi";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
  userName?: string;
  userEmail?: string;
  searchEnabled: boolean;
}

export default function Header({
  search,
  onSearchChange,
  onMenuClick,
  isDark,
  onThemeToggle,
  userName,
  userEmail,
  searchEnabled,
}: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur ${
        isDark
          ? "border-slate-800 bg-slate-900/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:h-16 sm:px-6 sm:py-0">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className={`rounded-lg p-2 transition lg:hidden ${
            isDark
              ? "text-slate-300 hover:bg-slate-800"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Open menu"
        >
          <FiMenu size={22} />
        </button>

        {/* Search */}
        {searchEnabled && <div className="relative flex-1">
          <FiSearch
            size={18}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search prompts, tags, and more..."
            aria-label="Search prompts"
            className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-violet-200 sm:py-2.5 ${
              isDark
                ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-slate-800"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
            }`}
          />
        </div>}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
            isDark
              ? "border-slate-700 text-yellow-400 hover:bg-slate-800"
              : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {isDark ? (
            <FiSun size={18} />
          ) : (
            <FiMoon size={18} />
          )}
        </button>

        <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200">
            {userName?.trim().charAt(0).toUpperCase() || <FiUser size={16} />}
          </div>
          <div className="hidden max-w-36 lg:block">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{userName || "Your workspace"}</p>
            <p className="truncate text-[11px] text-slate-500">{userEmail || ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

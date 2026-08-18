import {
  FiMenu,
  FiMoon,
  FiSearch,
  FiSun,
} from "react-icons/fi";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export default function Header({
  search,
  onSearchChange,
  onMenuClick,
  isDark,
  onThemeToggle,
}: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur ${
        isDark
          ? "border-slate-800 bg-slate-900/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
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
        <div className="relative flex-1">
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
            placeholder="Search prompts..."
            className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition ${
              isDark
                ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            }`}
          />
        </div>

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
      </div>
    </header>
  );
}
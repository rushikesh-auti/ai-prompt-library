import { useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../../hooks/useTheme";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onAddPrompt: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function DashboardLayout({
  children,
  onAddPrompt,
  activeView,
  onViewChange,
  search,
  onSearchChange,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar
            activeView={activeView}
            onViewChange={onViewChange}
            onAddPrompt={onAddPrompt}
          />
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            {/* Sidebar */}
            <div
              className={`relative z-10 h-full w-72 shadow-xl ${
                isDark ? "bg-slate-900" : "bg-white"
              }`}
            >
              <Sidebar
                activeView={activeView}
                onViewChange={(view) => {
                  onViewChange(view);
                  setMobileMenuOpen(false);
                }}
                onAddPrompt={() => {
                  setMobileMenuOpen(false);
                  onAddPrompt();
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <Header
            search={search}
            onSearchChange={onSearchChange}
            onMenuClick={() => setMobileMenuOpen(true)}
            isDark={isDark}
            onThemeToggle={toggleTheme}
          />

          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
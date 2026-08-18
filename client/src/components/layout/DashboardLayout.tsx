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
      className={`h-screen overflow-hidden transition-colors ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="flex h-screen">
        {/* ================================
            Desktop Sidebar
        ================================= */}

        <aside
          className={`hidden h-screen w-64 shrink-0 flex-col border-r lg:flex ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          {/* Sidebar Scroll Area */}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Sidebar
              activeView={activeView}
              onViewChange={onViewChange}
              onAddPrompt={onAddPrompt}
            />
          </div>
        </aside>

        {/* ================================
            Mobile Sidebar
        ================================= */}

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            {/* Mobile Sidebar */}

            <aside
              className={`relative z-10 h-full w-72 shadow-xl ${
                isDark ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="h-full overflow-y-auto">
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
            </aside>
          </div>
        )}

        {/* ================================
            Main Area
        ================================= */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}

          <div className="shrink-0">
            <Header
              search={search}
              onSearchChange={onSearchChange}
              onMenuClick={() => setMobileMenuOpen(true)}
              isDark={isDark}
              onThemeToggle={toggleTheme}
            />
          </div>

          {/* Dashboard Scroll Area */}

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [activeView, setActiveView] = useState("all");
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAddPrompt = () => {
    console.log("Add prompt clicked");
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      <div className="flex min-h-screen">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onAddPrompt={handleAddPrompt}
        />

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/30"
            />

            <div className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl">
              <Sidebar
                activeView={activeView}
                onViewChange={(view) => {
                  setActiveView(view);
                  setMobileMenuOpen(false);
                }}
                onAddPrompt={() => {
                  setMobileMenuOpen(false);
                  handleAddPrompt();
                }}
              />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Header
            search={search}
            onSearchChange={setSearch}
            onMenuClick={() => setMobileMenuOpen(true)}
            isDark={isDark}
            onThemeToggle={() => setIsDark((value) => !value)}
          />

          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
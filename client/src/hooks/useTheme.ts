import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "ai-prompt-library-theme";

const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return "light";
};

export function useTheme() {
  const [theme, setTheme] =
    useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  };

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
}
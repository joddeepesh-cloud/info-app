import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [accentColor, setAccentColor] = useState(localStorage.getItem("accentColor") || "cyan");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("accentColor", accentColor);
    const styleId = "accent-color-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    const colors = {
      cyan: "#00E5FF",
      amber: "#F59E0B",
      emerald: "#10B981",
      indigo: "#6366F1",
      rose: "#F43F5E",
      violet: "#8B5CF6"
    };
    
    const hex = colors[accentColor] || "#00E5FF";
    styleEl.innerHTML = `
      :root {
        --accent-color: ${hex};
      }
      .text-cyan-400 { color: ${hex} !important; }
      .bg-cyan-500 { background-color: ${hex} !important; }
      .border-cyan-500 { border-color: ${hex} !important; }
      .border-cyan-800 { border-color: ${hex}50 !important; }
      .bg-cyan-950\\/30 { background-color: ${hex}15 !important; }
      .hover\\:bg-cyan-600:hover { background-color: ${hex}dd !important; }
      .from-cyan-600\\/30 { --tw-gradient-from: ${hex}30 !important; }
    `;
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

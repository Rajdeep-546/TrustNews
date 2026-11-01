"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "../../src/context/ThemeContext";
import { cn } from "@/lib/utils";

export interface ThemeSwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  themeOverride?: "dark" | "light";
  onThemeChange?: (nextTheme: "dark" | "light") => void;
}

const ThemeSwitch = ({
  className,
  themeOverride,
  onThemeChange,
  ...props
}: ThemeSwitchProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [checked, setChecked] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const activeTheme = themeOverride ?? resolvedTheme ?? "dark";
    const isDark = activeTheme === "dark";
    setChecked(isDark);

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (isDark) {
        root.classList.remove("light-mode");
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.add("light-mode");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    }
  }, [resolvedTheme, themeOverride]);

  const handleCheckedChange = useCallback(
    (isChecked: boolean) => {
      const nextTheme = isChecked ? "dark" : "light";
      setChecked(isChecked);
      setTheme(nextTheme);
      onThemeChange?.(nextTheme);

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        if (isChecked) {
          root.classList.remove("light-mode");
          root.classList.add("dark");
          root.setAttribute("data-theme", "dark");
        } else {
          root.classList.add("light-mode");
          root.classList.remove("dark");
          root.setAttribute("data-theme", "light");
        }
      }
      try {
        window.localStorage.setItem("trustnews_theme", nextTheme);
      } catch {
        // Ignore storage errors
      }
    },
    [setTheme, onThemeChange]
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none", // center the whole control
        "h-9 w-20", // track sized to hug the icons
        className
      )}
      {...props}
    >
      {/* The real shadcn Switch (full-size, same structure) */}
      <Switch
        checked={checked}
        onCheckedChange={handleCheckedChange}
        aria-label="Toggle Dark or White theme"
        className={cn(
          // root (track)
          "peer absolute inset-0 h-full w-full rounded-full transition-colors border",
          checked
            ? "bg-neutral-900/95 border-neutral-700/90 hover:border-neutral-600"
            : "bg-slate-200/95 border-slate-300 hover:border-slate-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-1",
          // tune the default thumb size & z-index so it slides over icons
          "[&>span]:h-7 [&>span]:w-7 [&>span]:rounded-full [&>span]:shadow-md [&>span]:z-10 [&>span]:transition-transform [&>span]:duration-200",
          checked
            ? "[&>span]:bg-neutral-800 [&>span]:border [&>span]:border-neutral-600"
            : "[&>span]:bg-white [&>span]:border [&>span]:border-slate-300",
          // override default translate distances so the thumb moves across 20px track padding + icon spacing
          "data-[state=unchecked]:[&>span]:translate-x-1",
          "data-[state=checked]:[&>span]:translate-x-[44px]" // 44 ≈ w-20(80) - padding - thumb(28)
        )}
      />

      {/* Icons overlaid inside the track, perfectly centered left/right */}
      <span
        className={cn(
          "pointer-events-none absolute left-2.5 inset-y-0 z-20",
          "flex items-center justify-center"
        )}
      >
        <SunIcon
          size={15}
          className={cn(
            "transition-all duration-200 ease-out",
            checked ? "text-neutral-500 scale-95" : "text-amber-500 scale-110"
          )}
        />
      </span>

      <span
        className={cn(
          "pointer-events-none absolute right-2.5 inset-y-0 z-20",
          "flex items-center justify-center"
        )}
      >
        <MoonIcon
          size={15}
          className={cn(
            "transition-all duration-200 ease-out",
            checked ? "text-sky-400 scale-110" : "text-slate-500 scale-95"
          )}
        />
      </span>
    </div>
  );
};

export default ThemeSwitch;

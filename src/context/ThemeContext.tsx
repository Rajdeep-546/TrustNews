import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
  storageKey = 'trustnews_theme',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark') {
          return stored;
        }
      } catch {
        // Ignore storage errors
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme, storageKey]);

  const setTheme = useCallback(
    (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, nextTheme);
        } catch {
          // Ignore storage errors
        }
      }
    },
    [storageKey]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}

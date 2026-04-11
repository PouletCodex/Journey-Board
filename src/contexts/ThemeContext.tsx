import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ThemeName } from '../constants';
import { THEMES } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeTokens: typeof THEMES[ThemeName];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "journey_theme_v1";

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'Dark Glass';

  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  if (prefersLight) return 'Light';
  if (prefersDark) return 'Dark Glass';
  return 'Dark Glass';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeName>(
    THEME_STORAGE_KEY,
    getInitialTheme()
  );

  const value: ThemeContextType = useMemo(() => ({
    theme,
    setTheme,
    themeTokens: THEMES[theme],
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

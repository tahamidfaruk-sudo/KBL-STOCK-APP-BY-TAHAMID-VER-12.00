import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeName, ThemeMode } from '../types';

interface ThemeContextType {
  themeName: ThemeName;
  setThemeName: (theme: ThemeName) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('potato_app_session')) {
        sessionStorage.setItem('potato_app_session', 'active');
        localStorage.setItem('potato_theme_name', 'corporate-light');
        localStorage.setItem('potato_theme_mode', 'light');
        return 'corporate-light';
      }
      const saved = localStorage.getItem('potato_theme_name');
      return (saved as ThemeName) || 'corporate-light';
    } catch {
      return 'corporate-light';
    }
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('potato_app_session')) {
        return 'light';
      }
      const saved = localStorage.getItem('potato_theme_mode');
      return (saved as ThemeMode) || 'light';
    } catch {
      return 'light';
    }
  });

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    try {
      localStorage.setItem('potato_theme_name', themeName);
      document.documentElement.setAttribute('data-theme', themeName);
    } catch (e) {
      console.warn('Failed to save theme name', e);
    }
  }, [themeName]);

  useEffect(() => {
    try {
      localStorage.setItem('potato_theme_mode', themeMode);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to update theme mode', e);
    }
  }, [themeMode, isDark]);

  const toggleMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        setThemeName,
        themeMode,
        setThemeMode,
        isDark,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

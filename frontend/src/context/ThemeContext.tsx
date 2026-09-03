import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('louvor_app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Dark como padrão elegante
  });

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', 'black-translucent');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', 'default');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('louvor_app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

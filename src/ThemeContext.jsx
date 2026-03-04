import { createContext, useContext, useState, useEffect } from 'react';

export const ACCENT_PRESETS = {
  violet: { name: 'Violeta', 400: '#a78bfa', 500: '#7c3aed', 600: '#6d28d9', ring: 'rgba(124,58,237,0.3)', bg10: 'rgba(124,58,237,0.1)' },
  blue: { name: 'Azul', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', ring: 'rgba(59,130,246,0.3)', bg10: 'rgba(59,130,246,0.1)' },
  emerald: { name: 'Esmeralda', 400: '#34d399', 500: '#10b981', 600: '#059669', ring: 'rgba(16,185,129,0.3)', bg10: 'rgba(16,185,129,0.1)' },
  rose: { name: 'Rosa', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', ring: 'rgba(244,63,94,0.3)', bg10: 'rgba(244,63,94,0.1)' },
  amber: { name: 'Âmbar', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', ring: 'rgba(245,158,11,0.3)', bg10: 'rgba(245,158,11,0.1)' },
  slate: { name: 'Cinza', 400: '#94a3b8', 500: '#64748b', 600: '#475569', ring: 'rgba(100,116,139,0.3)', bg10: 'rgba(100,116,139,0.1)' },
};

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('accentColor') || 'violet';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const preset = ACCENT_PRESETS[accentColor] || ACCENT_PRESETS.violet;
    const s = document.documentElement.style;
    s.setProperty('--accent-400', preset[400]);
    s.setProperty('--accent-500', preset[500]);
    s.setProperty('--accent-600', preset[600]);
    s.setProperty('--accent-ring', preset.ring);
    s.setProperty('--accent-bg10', preset.bg10);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setAccentColor = (color) => {
    if (ACCENT_PRESETS[color]) setAccentColorState(color);
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

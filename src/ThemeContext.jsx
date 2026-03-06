import { createContext, useContext, useState, useEffect } from 'react';

export const ACCENT_PRESETS = {
  indigo: { name: 'Índigo', 400: '#8b92e0', 500: '#5e6ad2', 600: '#4f5ac0', ring: 'rgba(94,106,210,0.25)', bg10: 'rgba(94,106,210,0.08)', iconFilter: 'hue-rotate(220deg) saturate(0.8) brightness(0.95)' },
  blue: { name: 'Azul', 400: '#6e9de0', 500: '#4283d4', 600: '#3672be', ring: 'rgba(66,131,212,0.25)', bg10: 'rgba(66,131,212,0.08)', iconFilter: 'hue-rotate(190deg) saturate(0.8) brightness(1.0)' },
  teal: { name: 'Teal', 400: '#5bbcb6', 500: '#3a9e97', 600: '#2e8a84', ring: 'rgba(58,158,151,0.25)', bg10: 'rgba(58,158,151,0.08)', iconFilter: 'hue-rotate(160deg) saturate(0.8) brightness(1.0)' },
  rose: { name: 'Rosa', 400: '#d98a95', 500: '#c25468', 600: '#ad4558', ring: 'rgba(194,84,104,0.25)', bg10: 'rgba(194,84,104,0.08)', iconFilter: 'hue-rotate(330deg) saturate(0.7) brightness(1.0)' },
  orange: { name: 'Laranja', 400: '#d4a06a', 500: '#c07a3a', 600: '#a96a2e', ring: 'rgba(192,122,58,0.25)', bg10: 'rgba(192,122,58,0.08)', iconFilter: 'none' },
  slate: { name: 'Cinza', 400: '#8b8f9a', 500: '#6b7080', 600: '#585d6c', ring: 'rgba(107,112,128,0.25)', bg10: 'rgba(107,112,128,0.08)', iconFilter: 'hue-rotate(190deg) saturate(0.15) brightness(1.1)' },
};

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('accentColor') || 'blue';
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
    const preset = ACCENT_PRESETS[accentColor] || ACCENT_PRESETS.indigo;
    const s = document.documentElement.style;
    s.setProperty('--accent-400', preset[400]);
    s.setProperty('--accent-500', preset[500]);
    s.setProperty('--accent-600', preset[600]);
    s.setProperty('--accent-ring', preset.ring);
    s.setProperty('--accent-bg10', preset.bg10);
    s.setProperty('--accent-icon-filter', preset.iconFilter);
    localStorage.setItem('accentColor', accentColor);

    // Dynamic favicon
    if (preset.iconFilter && preset.iconFilter !== 'none') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/favicon.png';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.filter = preset.iconFilter;
        ctx.drawImage(img, 0, 0);
        const link = document.querySelector('link[rel="icon"]');
        if (link) link.href = canvas.toDataURL('image/png');
      };
    } else {
      const link = document.querySelector('link[rel="icon"]');
      if (link) link.href = '/favicon.png';
    }
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

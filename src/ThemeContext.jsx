import { createContext, useContext, useState, useEffect } from 'react';

export const ACCENT_PRESETS = {
  violet: { name: 'Violeta', 400: '#a78bfa', 500: '#7c3aed', 600: '#6d28d9', ring: 'rgba(124,58,237,0.3)', bg10: 'rgba(124,58,237,0.1)', glow1: 'rgba(124,58,237,0.10)', glow2: 'rgba(99,102,241,0.10)', iconFilter: 'hue-rotate(240deg) saturate(1.4) brightness(0.95)' },
  blue: { name: 'Azul', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', ring: 'rgba(59,130,246,0.3)', bg10: 'rgba(59,130,246,0.1)', glow1: 'rgba(59,130,246,0.10)', glow2: 'rgba(37,99,235,0.10)', iconFilter: 'hue-rotate(190deg) saturate(1.3) brightness(1.05)' },
  emerald: { name: 'Esmeralda', 400: '#34d399', 500: '#10b981', 600: '#059669', ring: 'rgba(16,185,129,0.3)', bg10: 'rgba(16,185,129,0.1)', glow1: 'rgba(16,185,129,0.10)', glow2: 'rgba(5,150,105,0.10)', iconFilter: 'hue-rotate(130deg) saturate(1.4) brightness(1.05)' },
  rose: { name: 'Rosa', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', ring: 'rgba(244,63,94,0.3)', bg10: 'rgba(244,63,94,0.1)', glow1: 'rgba(244,63,94,0.10)', glow2: 'rgba(225,29,72,0.10)', iconFilter: 'hue-rotate(315deg) saturate(1.3) brightness(1.0)' },
  amber: { name: 'Âmbar', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', ring: 'rgba(245,158,11,0.3)', bg10: 'rgba(245,158,11,0.1)', glow1: 'rgba(245,158,11,0.10)', glow2: 'rgba(217,119,6,0.10)', iconFilter: 'none' },
  slate: { name: 'Cinza', 400: '#94a3b8', 500: '#64748b', 600: '#475569', ring: 'rgba(100,116,139,0.3)', bg10: 'rgba(100,116,139,0.1)', glow1: 'rgba(100,116,139,0.10)', glow2: 'rgba(71,85,105,0.10)', iconFilter: 'hue-rotate(190deg) saturate(0.15) brightness(1.1)' },
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
    s.setProperty('--accent-glow1', preset.glow1);
    s.setProperty('--accent-glow2', preset.glow2);
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

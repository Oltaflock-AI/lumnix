'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  c: {
    bgPage: string;
    bgSidebar: string;
    bgCard: string;
    bgCardHover: string;
    bgInput: string;
    bgTag: string;
    border: string;
    borderSubtle: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    shadow: string;
  };
}

const DARK = {
  bgPage: '#0A0A0A',
  bgSidebar: '#0A0A0A',
  bgCard: '#111111',
  bgCardHover: '#1A1A1A',
  bgInput: '#111111',
  bgTag: '#1A1A1A',
  border: '#222222',
  borderSubtle: '#1A1A1A',
  text: '#FAFAFA',
  textSecondary: '#888888',
  textMuted: '#555555',
  shadow: 'none',
};

const LIGHT = {
  bgPage: '#0A0A0A',
  bgSidebar: '#0A0A0A',
  bgCard: '#111111',
  bgCardHover: '#1A1A1A',
  bgInput: '#111111',
  bgTag: '#1A1A1A',
  border: '#222222',
  borderSubtle: '#1A1A1A',
  text: '#FAFAFA',
  textSecondary: '#888888',
  textMuted: '#555555',
  shadow: 'none',
};

const Ctx = createContext<ThemeCtx>({
  theme: 'dark',
  toggle: () => {},
  c: DARK,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  function toggle() {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('lumnix-theme', next);
      return next;
    });
  }

  const c = theme === 'dark' ? DARK : LIGHT;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = c.bgPage;
    document.body.style.color = c.text;
  }, [theme, c]);

  return <Ctx.Provider value={{ theme, toggle, c }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

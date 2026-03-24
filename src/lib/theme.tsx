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

const LIGHT = {
  bgPage: '#F5F4F2',
  bgSidebar: '#FAFAF9',
  bgCard: '#FFFFFF',
  bgCardHover: '#F9F9F8',
  bgInput: '#F3F4F6',
  bgTag: 'rgba(0,0,0,0.05)',
  border: 'rgba(0,0,0,0.10)',
  borderSubtle: 'rgba(0,0,0,0.06)',
  text: '#0F172A',           // near-black, strong contrast
  textSecondary: '#374151',  // dark gray — readable on white (7.4:1)
  textMuted: '#6B7280',      // medium gray — still passes AA (4.6:1)
  shadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
};

const DARK = {
  bgPage: '#0D0F14',
  bgSidebar: '#13151B',
  bgCard: '#1A1D25',
  bgCardHover: '#21242E',
  bgInput: '#1A1D25',
  bgTag: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.09)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  text: '#F1F5F9',
  textSecondary: '#A1AFBD',
  textMuted: '#64748B',
  shadow: '0 1px 6px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
};

const Ctx = createContext<ThemeCtx>({
  theme: 'light',
  toggle: () => {},
  c: LIGHT,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('lumnix-theme') as Theme;
    if (saved === 'dark') setTheme('dark');
  }, []);

  function toggle() {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('lumnix-theme', next);
      return next;
    });
  }

  const c = theme === 'dark' ? DARK : LIGHT;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = c.bgPage;
    document.body.style.color = c.text;
  }, [theme, c]);

  return <Ctx.Provider value={{ theme, toggle, c }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

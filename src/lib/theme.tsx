'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ColorTokens {
  bgPage: string;
  bgSidebar: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  bgTag: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  shadow: string;
  surfaceElevated: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  success: string;
  successSubtle: string;
  successBorder: string;
  warning: string;
  warningSubtle: string;
  warningBorder: string;
  danger: string;
  dangerSubtle: string;
  dangerBorder: string;
  accentGlow: string;
  accentTeal: string;
}

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  c: ColorTokens;
  setAccentColor: (hex: string) => void;
}

const DARK: ColorTokens = {
  bgPage: '#0B0F1A',
  bgSidebar: '#0B0F1A',
  bgCard: '#141924',
  bgCardHover: '#1C2333',
  bgInput: '#141924',
  bgTag: '#141924',
  border: 'rgba(139,92,246,0.08)',
  borderSubtle: 'rgba(139,92,246,0.05)',
  borderStrong: 'rgba(139,92,246,0.15)',
  text: '#F0EDFF',
  textSecondary: '#C4C0E8',
  textMuted: '#8B88B8',
  shadow: '0 1px 3px rgba(0,0,0,0.4)',
  surfaceElevated: '#141924',
  accent: '#7C3AED',
  accentHover: '#6D28D9',
  accentSubtle: 'rgba(124,58,237,0.12)',
  success: '#22C55E',
  successSubtle: 'rgba(34,197,94,0.12)',
  successBorder: 'rgba(34,197,94,0.25)',
  warning: '#F59E0B',
  warningSubtle: 'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.25)',
  danger: '#EF4444',
  dangerSubtle: 'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  accentGlow: '0 0 24px rgba(124,58,237,0.2), 0 0 64px rgba(124,58,237,0.08)',
  accentTeal: '#0891B2',
};

const LIGHT: ColorTokens = {
  bgPage: '#F7F6FE',
  bgSidebar: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardHover: '#F0EEF9',
  bgInput: '#F0EEF9',
  bgTag: '#F0EEF9',
  border: '#E4E2F4',
  borderSubtle: '#F0EEF9',
  borderStrong: '#D4D0E8',
  text: '#18163A',
  textSecondary: '#4A4770',
  textMuted: '#7C7AAA',
  shadow: '0 1px 3px rgba(91,33,182,0.06)',
  surfaceElevated: '#FFFFFF',
  accent: '#7C3AED',
  accentHover: '#6D28D9',
  accentSubtle: 'rgba(124,58,237,0.08)',
  success: '#22C55E',
  successSubtle: 'rgba(34,197,94,0.08)',
  successBorder: 'rgba(34,197,94,0.2)',
  warning: '#F59E0B',
  warningSubtle: 'rgba(245,158,11,0.08)',
  warningBorder: 'rgba(245,158,11,0.2)',
  danger: '#EF4444',
  dangerSubtle: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  accentGlow: '0 0 24px rgba(124,58,237,0.12), 0 0 64px rgba(124,58,237,0.04)',
  accentTeal: '#0891B2',
};

const Ctx = createContext<ThemeCtx>({
  theme: 'dark',
  toggle: () => {},
  c: DARK,
  setAccentColor: () => {},
});

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, rgb.r - amount).toString(16).padStart(2, '0');
  const g = Math.max(0, rgb.g - amount).toString(16).padStart(2, '0');
  const b = Math.max(0, rgb.b - amount).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function applyAccent(base: ColorTokens, hex: string, isDark: boolean): ColorTokens {
  const rgb = hexToRgb(hex);
  if (!rgb) return base;
  return {
    ...base,
    accent: hex,
    accentHover: darkenHex(hex, 20),
    accentSubtle: isDark
      ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.07)`
      : `rgba(${rgb.r},${rgb.g},${rgb.b},0.06)`,
  };
}

const DEFAULT_ACCENT = '#7C3AED';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lumnix-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
    const savedAccent = localStorage.getItem('lumnix-accent');
    if (savedAccent && /^#[0-9a-fA-F]{6}$/.test(savedAccent)) {
      setAccentColorState(savedAccent);
    }
    setMounted(true);
  }, []);

  function toggle() {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('lumnix-theme', next);
      return next;
    });
  }

  function setAccentColor(hex: string) {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setAccentColorState(hex);
      localStorage.setItem('lumnix-accent', hex);
    }
  }

  const base = theme === 'dark' ? DARK : LIGHT;
  const c = accentColor !== DEFAULT_ACCENT ? applyAccent(base, accentColor, theme === 'dark') : base;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.body.style.backgroundColor = c.bgPage;
    document.body.style.color = c.text;
  }, [theme, c]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <Ctx.Provider value={{ theme, toggle, c, setAccentColor }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

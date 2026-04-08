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
  bgPage: '#07070A',
  bgSidebar: '#07070A',
  bgCard: '#0E0E13',
  bgCardHover: '#16161E',
  bgInput: '#0E0E13',
  bgTag: '#16161E',
  border: '#1E1E2A',
  borderSubtle: '#16161E',
  borderStrong: '#2A2A3A',
  text: '#EDEDF0',
  textSecondary: '#8585A0',
  textMuted: '#4E4E66',
  shadow: 'none',
  surfaceElevated: '#16161E',
  accent: '#FF6154',
  accentHover: '#E5503F',
  accentSubtle: 'rgba(255,97,84,0.07)',
  success: '#34D399',
  successSubtle: 'rgba(52,211,153,0.07)',
  successBorder: 'rgba(52,211,153,0.18)',
  warning: '#FBBF24',
  warningSubtle: 'rgba(251,191,36,0.07)',
  warningBorder: 'rgba(251,191,36,0.18)',
  danger: '#F87171',
  dangerSubtle: 'rgba(248,113,113,0.07)',
  dangerBorder: 'rgba(248,113,113,0.18)',
  accentGlow: '0 0 24px rgba(255,97,84,0.12), 0 0 64px rgba(255,97,84,0.04)',
  accentTeal: '#22D3EE',
};

const LIGHT: ColorTokens = {
  bgPage: '#FAF9F7',
  bgSidebar: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardHover: '#F3F2EE',
  bgInput: '#FFFFFF',
  bgTag: '#EEEEE8',
  border: '#E0DED8',
  borderSubtle: '#F0EEE8',
  borderStrong: '#D8D6D0',
  text: '#111118',
  textSecondary: '#55546A',
  textMuted: '#8B8A9E',
  shadow: '0 1px 4px rgba(0,0,0,0.06)',
  surfaceElevated: '#F3F2EE',
  accent: '#FF6154',
  accentHover: '#E5503F',
  accentSubtle: 'rgba(255,97,84,0.06)',
  success: '#059669',
  successSubtle: 'rgba(5,150,105,0.06)',
  successBorder: 'rgba(5,150,105,0.18)',
  warning: '#D97706',
  warningSubtle: 'rgba(217,119,6,0.06)',
  warningBorder: 'rgba(217,119,6,0.18)',
  danger: '#DC2626',
  dangerSubtle: 'rgba(220,38,38,0.06)',
  dangerBorder: 'rgba(220,38,38,0.18)',
  accentGlow: '0 0 20px rgba(255,97,84,0.08), 0 0 48px rgba(255,97,84,0.03)',
  accentTeal: '#22D3EE',
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

const DEFAULT_ACCENT = '#FF6154';

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

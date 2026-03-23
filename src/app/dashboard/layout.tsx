'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, BarChart3, DollarSign,
  Target, Brain, Eye, FileText, Bell, Settings,
  Menu, X, LogOut, ChevronDown, Plus, Sun, Moon
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks';

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('lumnix-theme');
    if (saved === 'dark') setDark(true);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('lumnix-theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.style.setProperty('--bg-page', '#0F172A');
      document.documentElement.style.setProperty('--bg-sidebar', '#0F172A');
      document.documentElement.style.setProperty('--bg-card', '#1E293B');
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F8FAFC';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.style.setProperty('--bg-page', '#F7F7F5');
      document.documentElement.style.setProperty('--bg-sidebar', '#FAFAF9');
      document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
      document.body.style.backgroundColor = '#F7F7F5';
      document.body.style.color = '#111827';
      document.documentElement.removeAttribute('data-theme');
    }
  }
  return { dark, toggle };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/seo', label: 'SEO Intelligence', icon: Search },
  { href: '/dashboard/analytics', label: 'Web Analytics', icon: BarChart3 },
  { href: '/dashboard/google-ads', label: 'Google Ads', icon: DollarSign },
  { href: '/dashboard/meta-ads', label: 'Meta Ads', icon: Target },
  { href: '/dashboard/ai', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/competitors', label: 'Competitor Spy', icon: Eye, accent: '#BE123C' },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WorkspaceSwitcher({ workspace, accent }: { workspace: any; accent: string }) {
  const [open, setOpen] = useState(false);
  const initials = workspace?.name ? workspace.name.substring(0, 2).toUpperCase() : 'LX';

  return (
    <div style={{ position: 'relative', marginBottom: '4px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px', borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.07)',
          backgroundColor: 'rgba(0,0,0,0.02)', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {workspace?.logo_url ? (
          <img src={workspace.logo_url} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'white', flexShrink: 0 }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workspace?.name || 'My Workspace'}
          </div>
        </div>
        <ChevronDown size={12} color="#9ca3af" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            {workspace?.logo_url ? (
              <img src={workspace.logo_url} alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, color: 'white' }}>
                {initials}
              </div>
            )}
            <span style={{ fontSize: '12px', color: '#111827', flex: 1 }}>{workspace?.name || 'My Workspace'}</span>
            <CheckIcon size={11} color={accent} />
          </div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '4px 6px' }}>
            <button onClick={() => setOpen(false)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 4px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}>
              <Plus size={12} /> Add workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { workspace } = useWorkspace();
  const accent = workspace?.brand_color || '#7C3AED';
  const { dark, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div style={{
      width: '220px', minHeight: '100vh',
      backgroundColor: '#FAFAF9',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '2px 10px 16px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.03em', color: '#111827' }}>
          <span style={{ color: '#7C3AED' }}>Lumnix</span>
        </span>
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher workspace={workspace} accent={accent} />

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '12px 0' }} />

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const isCompetitor = !!item.accent;
          const activeColor = isCompetitor ? '#BE123C' : '#7C3AED';

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); router.push(item.href); setSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '7px',
                color: active ? activeColor : '#4b5563',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'all 0.1s ease',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(0,0,0,0.03)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
              }}
            >
              <item.icon size={15} color={active ? activeColor : '#9ca3af'} strokeWidth={active ? 2 : 1.75} />
              <span>{item.label}</span>
              {isCompetitor && !active && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#BE123C', marginLeft: 'auto', flexShrink: 0 }} />
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px', marginTop: '12px' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', border: 'none', backgroundColor: 'transparent', color: '#6b7280', fontSize: '12.5px', cursor: 'pointer', marginBottom: '4px' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: accent, flexShrink: 0 }}>
            {workspace?.name ? workspace.name[0].toUpperCase() : 'L'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace?.name || 'Workspace'}</div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '2px' }} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F7F5' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">{sidebar}</div>
      <style>{`.desktop-sidebar { display: flex !important; } @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }`}</style>

      {/* Mobile Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FAFAF9', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px', display: 'none' }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.03em', color: '#7C3AED' }}>Lumnix</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .mobile-header { display: block !important; } }`}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
          <div style={{ position: 'relative', zIndex: 51 }}>{sidebar}</div>
        </div>
      )}

      {/* Main content — no header bar, title in page */}
      <main style={{ flex: 1, overflow: 'auto', maxHeight: '100vh', backgroundColor: '#F7F7F5' }} className="main-content">
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

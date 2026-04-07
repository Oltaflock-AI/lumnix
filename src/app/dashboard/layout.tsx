'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, BarChart3, DollarSign,
  Target, Brain, Eye, FileText, Bell, Settings,
  Menu, X, LogOut, ChevronDown, Plus, GitBranch, RefreshCw, User,
  Sun, Moon, MessageCircle, Palette, Rocket
} from 'lucide-react';
import { WorkspaceProvider, useWorkspaceCtx } from '@/lib/workspace-context';
import { ThemeProvider, useTheme } from '@/lib/theme';

const navGroups = [
  {
    label: 'Analytics',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/seo', label: 'SEO', icon: Search },
    ],
  },
  {
    label: 'Advertising',
    items: [
      { href: '/dashboard/google-ads', label: 'Google Ads', icon: DollarSign },
      { href: '/dashboard/meta-ads', label: 'Meta Ads', icon: Target },
      { href: '/dashboard/creative', label: 'Creative Studio', icon: Palette },
      { href: '/dashboard/campaigns', label: 'Campaigns', icon: Rocket },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/dashboard/ai', label: 'AI Assistant', icon: Brain },
      { href: '/dashboard/competitors', label: 'Competitors', icon: Eye },
      { href: '/dashboard/attribution', label: 'Attribution', icon: GitBranch },
    ],
  },
  {
    label: '',
    items: [
      { href: '/dashboard/reports', label: 'Reports', icon: FileText },
      { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function WorkspaceSwitcher({ workspace, accent }: { workspace: any; accent: string }) {
  const [open, setOpen] = useState(false);
  const { c } = useTheme();
  const { workspaces, switchWorkspace } = useWorkspaceCtx();
  const initials = workspace?.name ? workspace.name.substring(0, 2).toUpperCase() : 'LX';

  function handleSwitch(id: string) {
    setOpen(false);
    if (id !== workspace?.id) {
      switchWorkspace(id);
    }
  }

  return (
    <div style={{ position: 'relative', marginBottom: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8,
          border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {workspace?.logo_url ? (
          <img src={workspace.logo_url} alt="Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', flexShrink: 0, boxShadow: `0 0 0 2px ${c.bgPage}, 0 0 0 3px rgba(124,58,237,0.3)` }}>{initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workspace?.name || 'My Workspace'}
          </div>
        </div>
        <ChevronDown size={12} color={c.textMuted} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: c.surfaceElevated, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '4px 6px', maxHeight: 200, overflowY: 'auto' }}>
            {workspaces.map(ws => {
              const isCurrent = ws.id === workspace?.id;
              const wsInitials = ws.name ? ws.name.substring(0, 2).toUpperCase() : '??';
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSwitch(ws.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 8px', borderRadius: 6, border: 'none',
                    backgroundColor: isCurrent ? c.accentSubtle : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = c.bgCardHover; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: isCurrent ? accent : c.borderStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'white', flexShrink: 0 }}>{wsInitials}</div>
                  <span style={{ fontSize: 12, color: isCurrent ? c.text : c.textSecondary, flex: 1, fontWeight: isCurrent ? 600 : 400 }}>{ws.name}</span>
                  {isCurrent && (
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ borderTop: `1px solid ${c.border}`, padding: '4px 6px' }}>
            <button onClick={() => setOpen(false)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: c.textMuted, fontSize: 12, cursor: 'pointer' }}>
              <Plus size={12} /> Add workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useWorkspaceCtx();
  const { c, theme, toggle } = useTheme();
  const accent = workspace?.brand_color || c.accent;

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div style={{ width: 240, minHeight: '100vh', backgroundColor: c.bgPage, display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0, boxShadow: `1px 0 0 ${c.bgCardHover}` }}>
      {/* Logo */}
      <div style={{ padding: '2px 10px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src="/favicon.png" alt="Lumnix" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.05em', fontFamily: 'var(--font-display)', color: c.text }}>
          Lumnix
        </span>
      </div>

      <WorkspaceSwitcher workspace={workspace} accent={accent} />

      <div style={{ height: 1, backgroundColor: c.bgCardHover, margin: '12px 0' }} />

      <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            {group.label && (
              <div style={{ fontSize: 10, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 10px 5px', fontFamily: 'var(--font-display)' }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); router.push(item.href); onClose?.(); }}
                  className={active ? 'nav-active-pill' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', paddingLeft: active ? 7 : 10, borderRadius: '0 8px 8px 0',
                    color: active ? c.text : c.textSecondary,
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    textDecoration: 'none', cursor: 'pointer',
                    background: active ? `linear-gradient(90deg, ${c.accentSubtle}, transparent)` : 'transparent',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = c.bgCardHover; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: active ? c.accentSubtle : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 0.15s',
                    flexShrink: 0,
                  }}>
                    <item.icon size={14} color={active ? c.accent : c.textMuted} strokeWidth={active ? 2 : 1.75} />
                  </div>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <button
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: 'none', backgroundColor: 'transparent',
          cursor: 'pointer', color: c.textMuted,
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgCardHover}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Bottom section */}
      <div style={{ borderTop: `1px solid ${c.bgCardHover}`, paddingTop: 12, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={14} color={c.textSecondary} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace?.name || 'Workspace'}
            </div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Settings</div>
          </div>
          <button
            aria-label="Sign out"
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 2 }}
            onMouseEnter={e => (e.currentTarget.style.color = c.textSecondary)}
            onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
        {/* Feedback link */}
        <a
          href="mailto:khush@oltaflock.ai?subject=Lumnix Beta Feedback"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 12, color: c.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
        >
          <MessageCircle size={13} /> Give feedback
        </a>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.replace('/auth/signin?redirect=' + encodeURIComponent(window.location.pathname));
        } else {
          setAuthed(true);
        }
        setChecked(true);
      });
    });
  }, []);

  if (!checked) return <div style={{ minHeight: '100vh' }} />;
  if (!authed) return null;
  return <>{children}</>;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { c } = useTheme();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bgPage }}>
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <SidebarInner />
      </div>
      <style>{`.desktop-sidebar { display: flex !important; } @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }`}</style>

      {/* Mobile header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: c.bgPage, borderBottom: `1px solid ${c.border}`, padding: '12px 16px', display: 'none' }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/favicon.png" alt="Lumnix" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.05em', fontFamily: 'var(--font-display)', color: c.text }}>
              Lumnix
            </span>
          </div>
          <button aria-label={sidebarOpen ? 'Close menu' : 'Open menu'} onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: c.textSecondary, cursor: 'pointer' }}>
            {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .mobile-header { display: block !important; } }`}</style>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} className="backdrop-blur-overlay" style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'relative', zIndex: 51 }}>
            <SidebarInner onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main id="main-content" style={{ flex: 1, overflow: 'auto', maxHeight: '100vh', backgroundColor: c.bgPage }} className="main-content">
        <div style={{ padding: 32 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <WorkspaceProvider>
          <DashboardInner>{children}</DashboardInner>
        </WorkspaceProvider>
      </AuthGuard>
    </ThemeProvider>
  );
}

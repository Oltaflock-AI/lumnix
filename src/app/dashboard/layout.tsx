'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, BarChart3, DollarSign,
  Target, Brain, Eye, FileText, Bell, Settings,
  Menu, LogOut, ChevronDown, Plus, User,
  Sun, Moon, MessageCircle,
  PanelLeftClose, PanelLeft, Command as CommandIcon
} from 'lucide-react';
import { WorkspaceProvider, useWorkspaceCtx } from '@/lib/workspace-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem, CommandShortcut
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

/* ── Navigation Config ── */
type NavItem = { href: string; label: string; icon: any; shortcut?: string; badge?: boolean };
type NavGroup = { label: string; items: NavItem[] };
const navGroups: NavGroup[] = [
  {
    label: 'Analytics',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '1' },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, shortcut: '2' },
      { href: '/dashboard/seo', label: 'SEO', icon: Search, shortcut: '3' },
    ],
  },
  {
    label: 'Advertising',
    items: [
      { href: '/dashboard/google-ads', label: 'Google Ads', icon: DollarSign },
      { href: '/dashboard/meta-ads', label: 'Meta Ads', icon: Target },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/dashboard/ai', label: 'AI Assistant', icon: Brain },
      { href: '/dashboard/competitors', label: 'Competitors', icon: Eye },
    ],
  },
  {
    label: '',
    items: [
      { href: '/dashboard/reports', label: 'Reports', icon: FileText },
      { href: '/dashboard/alerts', label: 'Alerts', icon: Bell, badge: true },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ── Workspace Switcher ── */
function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const { workspace, workspaces, switchWorkspace } = useWorkspaceCtx();
  const accent = workspace?.brand_color || '#7C3AED';
  const initials = workspace?.name ? workspace.name.substring(0, 2).toUpperCase() : 'LX';

  function handleSwitch(id: string) {
    setOpen(false);
    if (id !== workspace?.id) switchWorkspace(id);
  }

  const trigger = (
    <button
      onClick={() => setOpen(!open)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8, justifyContent: collapsed ? 'center' : 'flex-start',
        border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      {workspace?.logo_url ? (
        <img src={workspace.logo_url} alt="Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', flexShrink: 0 }}>{initials}</div>
      )}
      {!collapsed && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {workspace?.name || 'My Workspace'}
            </div>
          </div>
          <ChevronDown size={12} color="#64748B" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </>
      )}
    </button>
  );

  return (
    <div style={{ position: 'relative', marginBottom: 4 }}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{workspace?.name || 'My Workspace'}</TooltipContent>
        </Tooltip>
      ) : trigger}
      {open && !collapsed && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
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
                    backgroundColor: isCurrent ? 'rgba(124,58,237,0.15)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: isCurrent ? accent : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'white', flexShrink: 0 }}>{wsInitials}</div>
                  <span style={{ fontSize: 12, color: isCurrent ? '#FFFFFF' : '#94A3B8', flex: 1, fontWeight: isCurrent ? 600 : 400 }}>{ws.name}</span>
                  {isCurrent && (
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 6px' }}>
            <button onClick={() => setOpen(false)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
              <Plus size={12} /> Add workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Command Palette ── */
function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Navigate" description="Search pages and actions">
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navGroups.filter(g => g.label).map(group => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map(item => (
              <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
                <item.icon className="size-4 opacity-60" />
                <span>{item.label}</span>
                {'shortcut' in item && item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { navigate('/dashboard/settings'); }}>
            <Settings className="size-4 opacity-60" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate('/dashboard/reports'); }}>
            <FileText className="size-4 opacity-60" />
            <span>Generate Report</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* ── Sidebar ── */
function SidebarInner({ collapsed, onCollapse, onClose }: { collapsed: boolean; onCollapse?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useWorkspaceCtx();
  const { theme, toggle } = useTheme();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (!workspace?.id) return;
    fetch(`/api/anomalies?workspace_id=${workspace.id}`)
      .then(r => r.json())
      .then(data => {
        const anomalies = data.anomalies || [];
        setUnreadAlerts(anomalies.filter((a: any) => !a.is_read).length);
      })
      .catch(() => {});
  }, [workspace?.id]);

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <div className="sidebar-glass" style={{
      width: sidebarWidth, minHeight: '100vh',
      display: 'flex', flexDirection: 'column', padding: collapsed ? '20px 8px' : '20px 12px',
      flexShrink: 0,
      transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Logo + Collapse */}
      <div style={{ padding: collapsed ? '2px 0 18px' : '2px 10px 18px', display: 'flex', alignItems: 'center', gap: 9, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img src="/favicon.png" alt="Lumnix" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain', flexShrink: 0 }} />
        {!collapsed && (
          <span className="gradient-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.05em', fontFamily: 'var(--font-display)', flex: 1 }}>
            Lumnix
          </span>
        )}
        {onCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onCollapse} className="sidebar-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <WorkspaceSwitcher collapsed={collapsed} />

      <Separator className="my-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

      {/* Nav */}
      <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            {group.label && !collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 16px 6px 16px', fontFamily: "'DM Sans', sans-serif" }}>
                {group.label}
              </div>
            )}
            {collapsed && group.label && <Separator className="my-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />}
            {group.items.map(item => {
              const active = isActive(item.href);
              const navLink = (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); router.push(item.href); onClose?.(); }}
                  className={active && !collapsed ? 'nav-active-pill' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                    padding: collapsed ? '8px 0' : '8px 10px',
                    paddingLeft: active && !collapsed ? 7 : collapsed ? 0 : 10,
                    borderRadius: collapsed ? 8 : '0 8px 8px 0',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: active ? '#FFFFFF' : '#94A3B8',
                    fontSize: 13, fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.01em',
                    textDecoration: 'none', cursor: 'pointer',
                    background: active ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    transition: 'background-color 0.15s, color 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.08)'; e.currentTarget.style.color = '#E2E8F0'; const icon = e.currentTarget.querySelector('svg'); if (icon) (icon as SVGElement).style.color = '#7C3AED'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; const icon = e.currentTarget.querySelector('svg'); if (icon) (icon as SVGElement).style.color = '#64748B'; } }}
                >
                  <item.icon size={16} color={active ? '#7C3AED' : '#64748B'} strokeWidth={1.5} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, opacity: 1, overflow: 'hidden', whiteSpace: 'nowrap', transition: 'opacity 250ms' }}>{item.label}</span>
                      {'badge' in item && item.badge && unreadAlerts > 0 && (
                        <span style={{ background: '#7C3AED', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, lineHeight: '16px', marginLeft: 'auto' }}>{unreadAlerts}</span>
                      )}
                    </>
                  )}
                </a>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                      {'shortcut' in item && item.shortcut && <span className="ml-2 text-muted-foreground text-xs">{item.shortcut}</span>}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.href}>{navLink}</div>;
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', padding: '8px 0', borderRadius: 8,
                border: 'none', backgroundColor: 'transparent',
                cursor: 'pointer', color: '#64748B',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>

        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '8px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={14} color="#94A3B8" />
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {workspace?.name || 'Workspace'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Settings</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Sign out"
                    onClick={async () => {
                      const { supabase } = await import('@/lib/supabase');
                      await supabase.auth.signOut();
                      window.location.href = '/auth/signin';
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                  >
                    <LogOut size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
        {!collapsed && (
          <a
            href="mailto:khush@oltaflock.ai?subject=Lumnix Beta Feedback"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 12, color: '#64748B', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
          >
            <MessageCircle size={13} /> Give feedback
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Auth Guard ── */
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

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src="/favicon.png" alt="Lumnix" style={{ width: 32, height: 32, borderRadius: 8, opacity: 0.6 }} className="animate-pulse" />
      </div>
    </div>
  );
  if (!authed) return null;
  return <>{children}</>;
}

/* ── Dashboard Shell ── */
function DashboardInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('lumnix-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      localStorage.setItem('lumnix-sidebar-collapsed', String(!prev));
      return !prev;
    });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const allItems = navGroups.flatMap(g => g.items);
      const match = allItems.find(i => 'shortcut' in i && i.shortcut === e.key);
      if (match && !e.metaKey && !e.ctrlKey && !e.altKey) {
        router.push(match.href);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router, toggleCollapse]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ display: 'none' }}>
        <SidebarInner collapsed={collapsed} onCollapse={toggleCollapse} />
      </div>
      <style>{`.desktop-sidebar { display: flex !important; } @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }`}</style>

      {/* Mobile header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '10px 16px', display: 'none' }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/favicon.png" alt="Lumnix" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.05em', fontFamily: 'var(--font-display)', color: '#0F172A' }}>
              Lumnix
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button variant="ghost" size="icon-sm" onClick={() => setCmdOpen(true)} aria-label="Search">
              <CommandIcon size={16} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </Button>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .mobile-header { display: block !important; } }`}</style>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[260px]" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarInner collapsed={false} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Main content */}
      <main id="main-content" style={{ flex: 1, overflow: 'auto', maxHeight: '100vh', backgroundColor: '#F8FAFC' }} className="main-content">
        <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
          {/* Cmd+K hint bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                border: '1px solid #E2E8F0', backgroundColor: '#F1F5F9',
                color: '#475569', fontSize: 13, cursor: 'pointer',
                width: 240,
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Search size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>Search anything...</span>
              <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', fontFamily: 'var(--font-mono)', color: '#94A3B8', letterSpacing: '0.02em' }}>
                ⌘K
              </kbd>
            </button>
          </div>
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

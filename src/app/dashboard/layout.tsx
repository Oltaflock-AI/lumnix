'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, BarChart3, DollarSign,
  Target, Brain, Eye, FileText, Bell, Settings,
  Menu, LogOut, ChevronDown, Plus, User,
  Sun, Moon, MessageCircle, CreditCard,
  Command as CommandIcon
} from 'lucide-react';
import { WorkspaceProvider, useWorkspaceCtx } from '@/lib/workspace-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem, CommandShortcut
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api-fetch';
import Image from 'next/image';
import { FeedbackDialog } from '@/components/FeedbackDialog';

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
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ── Workspace Switcher ── */
function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { workspace, workspaces, switchWorkspace, refetch } = useWorkspaceCtx();
  const { theme } = useTheme();
  const accent = workspace?.brand_color || '#7C3AED';
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function handleSwitch(id: string) {
    setOpen(false);
    if (id !== workspace?.id) switchWorkspace(id);
  }

  function handleAddClick() {
    setOpen(false);
    setShowAddModal(true);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Keyboard navigation for the dropdown
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, workspaces.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < workspaces.length) {
          handleSwitch(workspaces[focusedIndex].id);
        }
        break;
    }
  }, [open, focusedIndex, workspaces]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    const items = listRef.current?.querySelectorAll('[role="option"]');
    items?.[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: 4 }}>
      <button
        onClick={() => { setOpen(!open); if (!open) setFocusedIndex(0); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Workspace: ${workspace?.name || 'My Workspace'}. Press Enter to switch.`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {workspace?.logo_url ? (
          <img src={workspace.logo_url} alt="Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', flexShrink: 0 }}>
            {workspace?.name ? workspace.name.substring(0, 2).toUpperCase() : 'LX'}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#F1F5F9' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workspace?.name || 'My Workspace'}
          </div>
        </div>
        <ChevronDown size={12} color={isDark ? '#94A3B8' : '#9CA3AF'} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Switch workspace"
          ref={listRef}
          onKeyDown={handleKeyDown}
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', zIndex: 100, boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          <div style={{ padding: '4px 6px', maxHeight: 200, overflowY: 'auto' }}>
            {workspaces.map((ws, index) => {
              const isCurrent = ws.id === workspace?.id;
              const isFocused = index === focusedIndex;
              const wsInitials = ws.name ? ws.name.substring(0, 2).toUpperCase() : '??';
              return (
                <button
                  key={ws.id}
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => handleSwitch(ws.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 8px', borderRadius: 6, border: 'none',
                    backgroundColor: isFocused ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : isCurrent ? 'rgba(124,58,237,0.15)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background-color 0.15s',
                    outline: isFocused ? '2px solid #7C3AED' : 'none',
                    outlineOffset: -2,
                  }}
                  onMouseEnter={e => { setFocusedIndex(index); if (!isCurrent) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: isCurrent ? accent : (isDark ? '#334155' : '#E2E8F0'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: isCurrent ? 'white' : (isDark ? 'white' : '#374151'), flexShrink: 0 }}>{wsInitials}</div>
                  <span style={{ fontSize: 12, color: isCurrent ? (isDark ? '#FFFFFF' : '#7C3AED') : (isDark ? '#94A3B8' : '#6B7280'), flex: 1, fontWeight: isCurrent ? 600 : 400 }}>{ws.name}</span>
                  {isCurrent && (
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0', padding: '4px 6px' }}>
            <button onClick={handleAddClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12, cursor: 'pointer' }}>
              <Plus size={12} /> Add workspace
            </button>
          </div>
        </div>
      )}
      {showAddModal && (
        <AddWorkspaceModal
          onClose={() => setShowAddModal(false)}
          onCreated={(newWs) => {
            setShowAddModal(false);
            refetch();
            if (newWs?.id) switchWorkspace(newWs.id);
          }}
        />
      )}
    </div>
  );
}

/* ── Add Workspace Modal ── */
function AddWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ws: any) => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Workspace name required'); return; }
    setLoading(true);
    setError(null);
    setNeedsUpgrade(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not signed in'); setLoading(false); return; }

      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.required_plan === 'agency') {
          setNeedsUpgrade(true);
          setError(data.error || 'Multi-workspace requires Agency plan');
        } else {
          setError(data.error || 'Failed to create workspace');
        }
        setLoading(false);
        return;
      }

      onCreated(data.workspace);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  }

  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 420, padding: 24, borderRadius: 16,
          background: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 id="create-workspace-title" style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Create workspace
          </h3>
          <button onClick={onClose} aria-label="Close dialog" style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94A3B8' : '#6B7280', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 16 }}>
          Each workspace keeps its own integrations, data, and team. Only the Agency plan supports multiple workspaces.
        </p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? '#CBD5E1' : '#374151', marginBottom: 6 }}>
          Workspace name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Acme Client"
          disabled={loading || needsUpgrade}
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
            background: isDark ? '#0F172A' : '#F8FAFC',
            color: isDark ? '#F1F5F9' : '#0F172A',
            fontSize: 14, outline: 'none', marginBottom: 12,
          }}
        />

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, marginBottom: 12,
            background: needsUpgrade ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            border: needsUpgrade ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(239,68,68,0.3)',
            color: needsUpgrade ? '#F59E0B' : '#EF4444',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
              background: 'transparent', color: isDark ? '#CBD5E1' : '#374151',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {needsUpgrade ? (
            <button
              onClick={() => { onClose(); router.push('/dashboard/settings?tab=billing'); }}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#7C3AED', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Upgrade to Agency
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#7C3AED', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: loading || !name.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create workspace'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sign Out Confirmation ── */
function SignOutConfirmDialog({ isDark, onCancel, onConfirm }: { isDark: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="signout-title" onClick={e => e.stopPropagation()} style={{
        width: 340, padding: 24, borderRadius: 14,
        background: isDark ? '#1E293B' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} color="#EF4444" />
          </div>
          <h3 id="signout-title" style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sign out?</h3>
        </div>
        <p style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
          You&apos;ll need to sign in again to access your workspace.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} autoFocus style={{ padding: '8px 16px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', background: 'transparent', color: isDark ? '#CBD5E1' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
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
/* ── Section group colors for nav dots ── */
const GROUP_DOT_COLORS: Record<string, string> = {
  'Analytics': '#7C3AED',
  'Advertising': '#0891B2',
  'Intelligence': '#059669',
};

function SidebarInner({ onClose, collapsed = false, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useWorkspaceCtx();
  const { theme, toggle } = useTheme();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || '');
    });
  }, []);

  function handleFeedback() {
    setShowFeedback(true);
  }

  const sc = isDark ? {
    bg: '#0B0F1A',
    sectionLabel: '#8B88B8',
    navText: '#C4C0E8',
    navIcon: '#8B88B8',
    navTextHover: '#F0EDFF',
    navIconHover: '#A78BFA',
    navHoverBg: 'rgba(124,58,237,0.10)',
    navActiveText: '#F0EDFF',
    navActiveIcon: '#A78BFA',
    navActiveBg: 'rgba(124,58,237,0.12)',
    wsName: '#F0EDFF',
    userName: '#C4C0E8',
    userSub: '#8B88B8',
    separator: 'rgba(139,92,246,0.08)',
    avatarBg: 'rgba(139,92,246,0.1)',
    avatarBorder: 'rgba(139,92,246,0.15)',
    mutedIcon: '#8B88B8',
    border: 'rgba(139,92,246,0.08)',
  } : {
    bg: '#FFFFFF',
    sectionLabel: '#7C7AAA',
    navText: '#4A4770',
    navIcon: '#7C7AAA',
    navTextHover: '#18163A',
    navIconHover: '#7C3AED',
    navHoverBg: 'rgba(124,58,237,0.06)',
    navActiveText: '#7C3AED',
    navActiveIcon: '#7C3AED',
    navActiveBg: 'rgba(124,58,237,0.08)',
    wsName: '#18163A',
    userName: '#4A4770',
    userSub: '#7C7AAA',
    separator: '#E4E2F4',
    avatarBg: '#F0EEF9',
    avatarBorder: '#E4E2F4',
    mutedIcon: '#7C7AAA',
    border: '#E4E2F4',
  };

  useEffect(() => {
    if (!workspace?.id) return;
    apiFetch(`/api/anomalies?workspace_id=${workspace.id}`)
      .then(r => r.json())
      .then(data => {
        const anomalies = data.anomalies || [];
        setUnreadAlerts(anomalies.filter((a: any) => !a.is_read).length);
      })
      .catch(() => {});
  }, [workspace?.id]);

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const sidebarWidth = collapsed ? 56 : 220;

  return (
    <div style={{
      width: sidebarWidth, minHeight: '100vh',
      display: 'flex', flexDirection: 'column', padding: collapsed ? '16px 6px' : '16px 10px',
      flexShrink: 0, overflow: 'hidden', position: 'relative',
      backgroundColor: sc.bg,
      borderRight: `1px solid ${sc.border}`,
      transition: 'width 0.25s cubic-bezier(0.23,1,0.32,1), padding 0.25s cubic-bezier(0.23,1,0.32,1)',
    }}>
      {/* Logo + collapse toggle */}
      <div style={{ padding: collapsed ? '4px 0 14px' : '4px 6px 14px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, cursor: 'pointer' }}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Image src="/favicon.png" alt="Lumnix" width={30} height={30} priority style={{ borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
        {!collapsed && (
          <span className="gradient-text" style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', overflow: 'hidden', whiteSpace: 'nowrap' }}>Lumnix</span>
        )}
      </div>

      {!collapsed && <WorkspaceSwitcher />}

      <div style={{ height: 1, backgroundColor: sc.separator, margin: collapsed ? '8px 4px' : '10px 6px' }} />

      {/* Nav */}
      <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navGroups.map((group, gi) => (
          <div
            key={gi}
            role={group.label ? 'group' : undefined}
            aria-labelledby={group.label ? `nav-group-${gi}` : undefined}
            style={{ marginBottom: 4 }}
          >
            {group.label && !collapsed && (
              <h3
                id={`nav-group-${gi}`}
                style={{
                  fontSize: 11, fontWeight: 600, color: sc.sectionLabel,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '14px 12px 5px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 6,
                  margin: 0,
                }}
              >
                <span aria-hidden="true" style={{
                  width: 4, height: 4, borderRadius: '50%',
                  backgroundColor: GROUP_DOT_COLORS[group.label] || 'var(--accent)',
                  flexShrink: 0,
                }} />
                {group.label}
              </h3>
            )}
            {group.label && collapsed && (
              <h3 id={`nav-group-${gi}`} className="sr-only">{group.label}</h3>
            )}

            {group.items.map(item => {
              const active = isActive(item.href);

              const navItem = (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => { e.preventDefault(); router.push(item.href); onClose?.(); }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '9px 12px',
                    borderRadius: 8,
                    color: active ? sc.navActiveText : sc.navText,
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    fontFamily: "'DM Sans', sans-serif",
                    textDecoration: 'none', cursor: 'pointer',
                    background: active ? sc.navActiveBg : 'transparent',
                    transition: 'all 0.15s cubic-bezier(0.23,1,0.32,1)',
                    position: 'relative',
                    minHeight: 40,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = sc.navHoverBg;
                      e.currentTarget.style.color = sc.navTextHover;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = sc.navText;
                    }
                  }}
                >
                  {/* Active indicator pill */}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      left: collapsed ? 2 : 0,
                      top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: '0 4px 4px 0',
                      backgroundColor: '#7C3AED',
                      boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                    }} />
                  )}
                  <item.icon size={16} color={active ? sc.navActiveIcon : sc.navIcon} strokeWidth={1.5} style={{ transition: 'color 0.15s', flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {'shortcut' in item && item.shortcut && (
                        <kbd style={{
                          fontSize: 10, padding: '1px 5px', borderRadius: 4,
                          backgroundColor: isDark ? 'rgba(139,92,246,0.06)' : '#F0EEF9',
                          border: `1px solid ${sc.separator}`,
                          fontFamily: 'var(--font-mono)',
                          color: sc.sectionLabel, opacity: 0.6,
                        }}>
                          {item.shortcut}
                        </kbd>
                      )}
                      {'badge' in item && item.badge && unreadAlerts > 0 && (
                        <span style={{ background: '#7C3AED', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, lineHeight: '16px' }}>{unreadAlerts}</span>
                      )}
                    </>
                  )}
                </a>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                    <TooltipContent side="right" className="sidebar-tooltip">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.href}>{navItem}</div>;
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${sc.separator}`, paddingTop: 8 }}>
        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 0' : '8px 8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: sc.avatarBg, border: `1px solid ${sc.avatarBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: sc.userName, fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-display)',
          }}>
            {workspace?.name ? workspace.name.charAt(0).toUpperCase() : <User size={14} color={sc.mutedIcon} />}
          </div>
          {!collapsed && (
            <>
              <div style={{
                flex: 1, minWidth: 0,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 500, color: sc.userName,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {workspace?.name || 'Workspace'}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Sign out"
                    onClick={() => setShowSignOutConfirm(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: sc.mutedIcon, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = sc.userName)}
                    onMouseLeave={e => (e.currentTarget.style.color = sc.mutedIcon)}
                  >
                    <LogOut size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </>
          )}
          {showSignOutConfirm && (
            <SignOutConfirmDialog
              isDark={isDark}
              onCancel={() => setShowSignOutConfirm(false)}
              onConfirm={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth/signin';
              }}
            />
          )}
          <FeedbackDialog
            open={showFeedback}
            onClose={() => setShowFeedback(false)}
            workspaceId={workspace?.id}
            workspaceName={workspace?.name}
            userEmail={userEmail}
          />
        </div>

        {/* Utility row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '4px 0' : '6px 8px',
          gap: 4,
        }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={toggle}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: isDark ? 'rgba(139,92,246,0.08)' : '#F0EEF9',
                  border: `1px solid ${sc.separator}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: sc.mutedIcon,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.color = isDark ? '#C4B5FD' : '#7C3AED';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(139,92,246,0.08)' : '#F0EEF9';
                  e.currentTarget.style.borderColor = sc.separator;
                  e.currentTarget.style.color = sc.mutedIcon;
                }}
              >
                {isDark ? <Moon size={15} /> : <Sun size={15} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>

          {!collapsed && (
            <button
              onClick={handleFeedback}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 6,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, fontWeight: 500, color: sc.mutedIcon,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = sc.userName)}
              onMouseLeave={e => (e.currentTarget.style.color = sc.mutedIcon)}
            >
              <MessageCircle size={13} /> Feedback
            </button>
          )}
        </div>
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
        } else if (!session.user?.user_metadata?.onboarding_completed) {
          router.replace('/onboarding');
        } else {
          setAuthed(true);
        }
        setChecked(true);
      });
    });
  }, []);

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page, #F8FAFC)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Image src="/favicon.png" alt="Lumnix" width={32} height={32} className="animate-pulse" style={{ borderRadius: 8, objectFit: 'contain', opacity: 0.6 }} />
      </div>
    </div>
  );
  if (!authed) return null;
  return <>{children}</>;
}

/* ── Dashboard Shell ── */
function DashboardInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { c } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
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
  }, [router]);

  return (
    <div className="dashboard-scope" style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bgPage }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ display: 'none' }}>
        <SidebarInner collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(prev => !prev)} />
      </div>
      <style>{`.desktop-sidebar { display: flex !important; } @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }`}</style>

      {/* Mobile header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: c.bgCard, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'none' }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/favicon.png" alt="Lumnix" width={28} height={28} style={{ borderRadius: 7, objectFit: 'contain' }} />
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', color: c.text }}>Lumnix</span>
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
          <SidebarInner onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Main content */}
      <main id="main-content" style={{ flex: 1, overflow: 'auto', maxHeight: '100vh', backgroundColor: c.bgPage }} className="main-content">
        <div className="dash-content-pad" style={{ maxWidth: 1400 }}>
          {/* Cmd+K hint bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
                color: c.textMuted, fontSize: 13, cursor: 'pointer',
                width: 240,
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Search size={13} />
              <span style={{ flex: 1, textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>Search...</span>
              <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, fontFamily: 'var(--font-mono)', color: c.textMuted, letterSpacing: '0.02em' }}>
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

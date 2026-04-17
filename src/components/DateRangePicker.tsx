'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/theme';

const options = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

export function DateRangePicker({
  value = 30,
  onChange,
}: {
  value?: number;
  onChange?: (days: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const { c } = useTheme();

  const selected = options.find(o => o.value === value) || options[2];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        const currentIdx = options.findIndex(o => o.value === value);
        setFocusedIndex(currentIdx >= 0 ? currentIdx : 0);
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
        setFocusedIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange?.(options[focusedIndex].value);
          setOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  }, [open, focusedIndex, value, onChange]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) { const idx = options.findIndex(o => o.value === value); setFocusedIndex(idx >= 0 ? idx : 0); } }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Date range: ${selected.label}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
          color: c.text, fontSize: 13, cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Calendar size={14} color={c.accent} />
        {selected.label}
        <ChevronDown size={14} style={{ color: c.textMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select date range"
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            backgroundColor: c.surfaceElevated, border: `1px solid ${c.border}`,
            borderRadius: 10, overflow: 'hidden', minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {options.map((opt, index) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange?.(opt.value); setOpen(false); }}
              onMouseEnter={() => setFocusedIndex(index)}
              style={{
                display: 'block', width: '100%', padding: '10px 14px',
                textAlign: 'left', fontSize: 13, cursor: 'pointer', border: 'none',
                backgroundColor: index === focusedIndex ? c.accentSubtle : opt.value === value ? c.accentSubtle : 'transparent',
                color: opt.value === value ? c.accent : c.text,
                fontWeight: opt.value === value ? 600 : 400,
                outline: index === focusedIndex ? '2px solid #FF0066' : 'none',
                outlineOffset: -2,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

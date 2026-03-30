'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

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
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value) || options[2];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          border: '1px solid #222222', backgroundColor: '#111111',
          color: '#FAFAFA', fontSize: 13, cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Calendar size={14} color="#6366F1" />
        {selected.label}
        <ChevronDown size={14} style={{ color: '#555555', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
          backgroundColor: '#1A1A1A', border: '1px solid #222222',
          borderRadius: 10, overflow: 'hidden', minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange?.(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px',
                textAlign: 'left', fontSize: 13, cursor: 'pointer', border: 'none',
                backgroundColor: opt.value === value ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: opt.value === value ? '#6366F1' : '#FAFAFA',
                fontWeight: opt.value === value ? 600 : 400,
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

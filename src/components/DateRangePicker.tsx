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
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', borderRadius: '10px',
          border: '1px solid #3f3f46', backgroundColor: '#27272a',
          color: '#d4d4d8', fontSize: '13px', cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Calendar size={14} color="#a78bfa" />
        {selected.label}
        <ChevronDown size={14} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
          backgroundColor: '#18181b', border: '1px solid #27272a',
          borderRadius: '10px', overflow: 'hidden', minWidth: '160px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange?.(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px',
                textAlign: 'left', fontSize: '13px', cursor: 'pointer', border: 'none',
                backgroundColor: opt.value === value ? 'rgba(124,58,237,0.12)' : 'transparent',
                color: opt.value === value ? '#a78bfa' : '#d4d4d8',
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

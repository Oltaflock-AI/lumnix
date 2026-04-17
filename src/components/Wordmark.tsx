interface WordmarkProps {
  size?: number;
  markOnly?: boolean;
  className?: string;
}

export function Wordmark({ size = 28, markOnly = false, className }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.36, lineHeight: 1 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 88 88"
        fill="none"
        aria-hidden={markOnly ? undefined : true}
        role={markOnly ? 'img' : undefined}
        aria-label={markOnly ? 'Lumnix' : undefined}
        style={{ flexShrink: 0 }}
      >
        <circle cx="44" cy="44" r="42" fill="#FF0066" />
        <rect x="24" y="18" width="12" height="52" rx="2" fill="white" />
        <rect x="24" y="58" width="36" height="12" rx="2" fill="white" />
        <rect x="46" y="36" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="46" y="43" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="46" y="50" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
      </svg>
      {!markOnly && (
        <span
          style={{
            fontSize: size * 0.72,
            fontWeight: 800,
            color: 'var(--text-primary)',
            background: 'none',
            WebkitTextFillColor: 'var(--text-primary)',
            WebkitBackgroundClip: 'initial',
            backgroundClip: 'initial',
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Lumnix
        </span>
      )}
    </span>
  );
}

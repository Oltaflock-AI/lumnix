interface WordmarkProps {
  size?: number;
  markOnly?: boolean;
  className?: string;
}

export function Wordmark({ size = 28, markOnly = false, className }: WordmarkProps) {
  if (markOnly) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 88 88"
        fill="none"
        role="img"
        aria-label="Lumnix"
        className={className}
        style={{ flexShrink: 0 }}
      >
        <rect x="24" y="18" width="12" height="52" rx="2" fill="white" />
        <rect x="24" y="58" width="36" height="12" rx="2" fill="white" />
      </svg>
    );
  }

  return (
    <span
      className={className}
      style={{
        fontSize: size * 0.9,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.04em',
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      Lumnix
    </span>
  );
}

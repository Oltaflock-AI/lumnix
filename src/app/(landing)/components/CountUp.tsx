'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (n: number) => string;
}

export function CountUp({ target, prefix = '', suffix = '', duration = 2000, format }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  const display = format ? format(count) : count.toLocaleString('en-IN');
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

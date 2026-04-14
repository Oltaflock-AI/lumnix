'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface IntelCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
}

export function IntelCard({ children, className = '', style: outerStyle, maxTilt = 8 }: IntelCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), { stiffness: 200, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        willChange: 'transform',
        ...outerStyle,
      }}
    >
      {children}
    </motion.div>
  );
}

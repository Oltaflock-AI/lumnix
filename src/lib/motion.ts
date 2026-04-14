import type { Variants, Transition } from 'framer-motion';

type CubicBezier = [number, number, number, number];

/* ── Easing curves (match globals.css tokens) ── */
export const EASE_OUT_STRONG: CubicBezier = [0.23, 1, 0.32, 1];
export const EASE_SPRING: CubicBezier = [0.16, 1, 0.3, 1];
export const EASE_DRAWER: CubicBezier = [0.32, 0.72, 0, 1];

/* ── Reusable transitions ── */
export const fastTransition: Transition = {
  duration: 0.2,
  ease: EASE_OUT_STRONG,
};

export const mediumTransition: Transition = {
  duration: 0.35,
  ease: EASE_OUT_STRONG,
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/* ── Page transition ── */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

/* ── Fade in from below ── */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/* ── Stagger container for lists/grids ── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

/* ── Stagger child item ── */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT_STRONG },
  },
};

/* ── Scale on tap/press ── */
export const scaleOnTap = { whileTap: { scale: 0.98 } };

/* ── Card hover ── */
export const cardHover = {
  whileHover: { y: -2, transition: { duration: 0.2 } },
};

/* ── Scroll reveal (for landing page sections) ── */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_STRONG },
  },
};

/* ── Sidebar active indicator ── */
export const sidebarIndicator = {
  layoutId: 'sidebar-active',
  transition: springTransition,
};

/* ── Number count-up spring config ── */
export const countUpSpring = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001,
};

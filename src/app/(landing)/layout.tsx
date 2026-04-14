import type { Metadata } from 'next';
import './landing.css';

export const metadata: Metadata = {
  title: 'Lumnix — Marketing Intelligence for D2C Brands | Unified Analytics + AI',
  description:
    "Stop switching between 5 dashboards. Lumnix unifies GSC, GA4, Google Ads, Meta Ads, and competitor intelligence into one AI-powered platform. Built for Indian D2C brands and agencies.",
  openGraph: {
    title: "Your competitors know something you don't — Lumnix",
    description:
      "While you're switching between 5 dashboards, they're making decisions in one.",
    images: ['/og-image.png'],
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="war-room">{children}</div>;
}

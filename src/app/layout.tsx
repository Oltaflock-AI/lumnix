import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Krato — AI-Powered Marketing Intelligence',
  description: 'Unified marketing analytics platform. GSC, GA4, Google Ads, Meta Ads in one dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#09090b' }}>
      <body style={{ backgroundColor: '#09090b', color: '#f4f4f5', margin: 0 }}>{children}</body>
    </html>
  );
}

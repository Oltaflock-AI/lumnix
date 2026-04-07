import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumnix — AI-Powered Marketing Intelligence',
  description: 'Unified marketing analytics platform. GSC, GA4, Google Ads, Meta Ads in one dashboard.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  other: {
    'theme-color': '#09090B',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, backgroundColor: '#09090B', color: '#FAFAFA' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}

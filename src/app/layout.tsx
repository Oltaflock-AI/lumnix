import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import './mono.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Lumnix — AI-Powered Marketing Intelligence',
  description: 'Unified marketing analytics platform. GSC, GA4, Google Ads, Meta Ads in one dashboard.',
  icons: {
    icon: '/logo-mark.svg',
    apple: '/logo-mark.svg',
  },
  other: {
    'theme-color': '#0C0C10',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      style={{ colorScheme: 'dark' }}
      className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body style={{ margin: 0 }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <SpeedInsights />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

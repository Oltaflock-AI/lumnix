import type { Metadata } from 'next';
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
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
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  other: {
    'theme-color': '#F8FAFC',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      style={{ colorScheme: 'light' }}
      className={`${bricolage.variable} ${outfit.variable} ${jetbrainsMono.variable}`}

      suppressHydrationWarning
    >
      <body style={{ margin: 0, backgroundColor: '#F8FAFC', color: '#0F172A' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

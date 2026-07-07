import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { AuthProvider } from '@/components/AuthProvider';
import { AosInit } from '@/components/AosInit';
import { OmoToast } from '@/components/notifications/OmoToast';
import NextTopLoader from 'nextjs-toploader';
import { SensoryUIProvider } from '@/lib/provider';

export const metadata: Metadata = {
  title: {
    default: 'OmoZoku — Our Tribe',
    template: '%s | OmoZoku',
  },
  description:
    'OmoZoku is your anime community — discover, watch, and track anime with your tribe.',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'OmoZoku',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=supreme@400&f[]=nunito@800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-text-primary font-body antialiased selection:bg-accent/30 overflow-x-hidden min-h-dvh">
        <SensoryUIProvider>
          <AuthProvider>
            <NextTopLoader color="#FF2D55" showSpinner={false} height={2} shadow="0 0 10px #FF2D55,0 0 5px #FF2D55" />
            <OmoToast />
            <AosInit />
            <Sidebar />
            
            {/* Main content — offset by sidebar width on md+ */}
            <main className="md:pl-16 min-h-dvh pb-16 md:pb-0">
              {children}
            </main>
            <MobileNav />
          </AuthProvider>
        </SensoryUIProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'K2C Family',
  description: 'K2C Family - ruang komunikasi keluarga realtime',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'K2C Family',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B5CFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full w-full overflow-hidden bg-[#F2F2F7] dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


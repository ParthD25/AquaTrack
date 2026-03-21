import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'AquaTrack — Aquatics Management Platform',
  description: 'Professional aquatics management for lifeguard audits, shift tasks, training, and document control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

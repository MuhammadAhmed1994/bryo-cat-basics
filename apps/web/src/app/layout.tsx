import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cattlytics IVF',
  description: 'Nbryo — Cattlytics IVF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

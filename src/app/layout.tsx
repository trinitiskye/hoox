import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

const nunito = Nunito({ subsets: ['latin'], adjustFontFallback: false });

export const metadata: Metadata = {
  title: 'HOOX - Professional Tournament Management Platform',
  description: 'The ultimate platform for managing fishing tournaments. Connect anglers, track results, and grow your fishing community.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

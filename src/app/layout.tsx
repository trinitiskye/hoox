import type { Metadata } from 'next';
import { Nunito_Sans, Roboto, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

const nunito = Nunito_Sans({ subsets: ['latin'], adjustFontFallback: false });
const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700', '900'], variable: '--font-roboto' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: 'HOOX - Professional Tournament Management Platform',
  description: 'The ultimate platform for managing fishing tournaments. Connect anglers, track results, and grow your fishing community.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${montserrat.variable}`}>
      <body className={nunito.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

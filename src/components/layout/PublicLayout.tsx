'use client';

import { useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '@/lib/AuthContext';
import { toPath } from '@/lib/routes';

export default function PublicLayout({ children, bgClassName = 'bg-white' }: { children: React.ReactNode; bgClassName?: string }) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const navigate = (view: string) => router.push(toPath(view));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgClassName}`}>
      <Header currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

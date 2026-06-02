import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  trailing?: ReactNode;
  showLogout?: boolean;
}

export function Layout({
  children,
  title,
  subtitle,
  trailing,
  showLogout = true,
}: LayoutProps) {
  const { logout, currentUser } = useAuth();

  return (
    <div className="min-h-screen flex justify-center bg-slate-100">
      <div className="relative w-full max-w-[480px] bg-slate-50 shadow-app min-h-screen flex flex-col">
        {(title || subtitle || trailing || showLogout) && (
          <header className="px-5 pt-7 pb-4 bg-white border-b border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {subtitle && (
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-0.5 truncate">
                    {subtitle}
                  </p>
                )}
                {title && (
                  <h1 className="text-xl font-semibold text-slate-900 truncate">
                    {title}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-2">
                {trailing}
                {showLogout && currentUser && (
                  <>
                    <Link
                      to="/settings"
                      aria-label="Configurações"
                      className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Settings size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      aria-label="Sair"
                      title={`Sair (${currentUser.email})`}
                      className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                    >
                      <LogOut size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 px-5 pt-5 pb-28">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

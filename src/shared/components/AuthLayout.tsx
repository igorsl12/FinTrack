import type { ReactNode } from 'react';
import { Wallet } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex justify-center bg-slate-100">
      <div className="relative w-full max-w-[480px] bg-slate-50 shadow-app min-h-screen flex flex-col">
        <div className="flex-1 px-6 pt-12 pb-8 flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <div className="h-10 w-10 rounded-2xl bg-balance text-white flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="text-lg font-semibold text-slate-900">FinTrack</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            )}
          </div>

          {children}

          {footer && (
            <div className="mt-auto pt-6 text-center text-sm text-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

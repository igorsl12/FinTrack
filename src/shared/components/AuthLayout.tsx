import type { ReactNode } from 'react';

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
          <div className="flex flex-col items-center gap-2 mb-10">
            <img
              src="/icon-192.png"
              alt="FinTrack"
              width={80}
              height={80}
              className="h-20 w-20"
            />
            <span className="text-xl font-semibold text-slate-900">FinTrack</span>
          </div>

          <div className="mb-6 text-center">
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

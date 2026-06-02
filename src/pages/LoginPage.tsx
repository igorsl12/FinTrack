import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/shared/components/AuthLayout';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ImportBackupCard } from '@/features/settings/components/ImportBackupCard';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar suas finanças."
      footer={
        <>
          Não tem conta?{' '}
          <Link to="/register" className="text-balance font-medium hover:underline">
            Criar agora
          </Link>
        </>
      }
    >
      <AuthForm
        mode="login"
        onSubmit={async ({ email, password }) => {
          const result = await login(email, password);
          if (result.ok) navigate(from, { replace: true });
          return result;
        }}
      />

      <div className="mt-6 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          ou
        </span>
        <span className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="mt-4">
        <ImportBackupCard />
      </div>
    </AuthLayout>
  );
}

import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/shared/components/AuthLayout';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto e seus dados ficam só no seu dispositivo."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="text-balance font-medium hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <AuthForm
        mode="register"
        onSubmit={async ({ name, email, password }) => {
          const result = await register(name, email, password);
          if (result.ok) navigate('/', { replace: true });
          return result;
        }}
      />
    </AuthLayout>
  );
}

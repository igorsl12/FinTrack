import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';

export type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit({ name, email, password });
      if (!result.ok) setError(result.error);
    } catch {
      setError('Algo deu errado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {isRegister && (
        <Field label="Nome">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como podemos te chamar"
            className="form-input"
            autoComplete="name"
            required
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="form-input"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Senha">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'Mínimo 6 caracteres' : '••••••••'}
            className="form-input pr-10"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            minLength={isRegister ? 6 : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>

      {error && (
        <p className="text-sm text-expense-dark bg-expense-light rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={submitting}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Aguarde...
          </span>
        ) : isRegister ? (
          'Criar conta'
        ) : (
          'Entrar'
        )}
      </Button>

      <style>{`
        .form-input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .form-input:focus {
          border-color: #378ADD;
          box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

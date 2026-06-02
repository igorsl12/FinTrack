import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const initialized = useAuthStore((s) => s.initialized);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    initialized,
    login,
    register,
    logout,
  };
}

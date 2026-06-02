import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createZustandStorage, webStorage } from '@/shared/lib/storage';
import { userRepository } from '@/shared/db/userRepository';
import {
  hashPassword,
  verifyPassword,
  InsecureContextError,
} from '../utils/passwordHash';
import type { User } from '../types';

export const AUTH_STORAGE_KEY = 'fintrack:auth';

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

interface AuthState {
  currentUser: User | null;
  initialized: boolean;
  initialize(): Promise<void>;
  login(email: string, password: string): Promise<AuthResult>;
  register(name: string, email: string, password: string): Promise<AuthResult>;
  logout(): void;
}

function publicProfile(record: {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.createdAt,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      initialized: false,

      async initialize() {
        if (get().initialized) return;
        const userId = get().currentUser?.id;
        if (userId) {
          const fresh = await userRepository.findById(userId);
          set({
            currentUser: fresh ? publicProfile(fresh) : null,
            initialized: true,
          });
        } else {
          set({ initialized: true });
        }
      },

      async login(email, password) {
        const normalized = email.toLowerCase().trim();
        if (!normalized || !password) {
          return { ok: false, error: 'Informe email e senha.' };
        }
        try {
          const record = await userRepository.findByEmail(normalized);
          if (!record) {
            return { ok: false, error: 'Email ou senha incorretos.' };
          }
          const valid = await verifyPassword(
            password,
            record.passwordHash,
            record.passwordSalt,
          );
          if (!valid) {
            return { ok: false, error: 'Email ou senha incorretos.' };
          }
          const user = publicProfile(record);
          set({ currentUser: user });
          return { ok: true, user };
        } catch (e) {
          if (e instanceof InsecureContextError) {
            return { ok: false, error: e.message };
          }
          throw e;
        }
      },

      async register(name, email, password) {
        const normalizedName = name.trim();
        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedName.length < 2) {
          return { ok: false, error: 'Informe um nome com ao menos 2 letras.' };
        }
        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
          return { ok: false, error: 'Informe um email válido.' };
        }
        if (password.length < 6) {
          return { ok: false, error: 'A senha precisa ter ao menos 6 caracteres.' };
        }
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing) {
          return { ok: false, error: 'Já existe uma conta com este email.' };
        }
        try {
          const { hash, salt } = await hashPassword(password);
          const record = await userRepository.create({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash: hash,
            passwordSalt: salt,
          });
          const user = publicProfile(record);
          set({ currentUser: user });
          return { ok: true, user };
        } catch (e) {
          if (e instanceof InsecureContextError) {
            return { ok: false, error: e.message };
          }
          throw e;
        }
      },

      logout() {
        set({ currentUser: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => createZustandStorage(webStorage)),
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
);

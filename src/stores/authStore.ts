import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

function getInitialAuthState(): {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
} {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && userStr) {
      const user = JSON.parse(userStr) as User;
      if (user && user.id && user.role) {
        return {
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse user from localStorage:', err);
  }

  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialAuthState(),

  login: (user, accessToken, refreshToken) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      console.warn('Failed to save auth to localStorage:', err);
    }
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (err) {
      console.warn('Failed to remove auth from localStorage:', err);
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    set(getInitialAuthState());
  },
}));

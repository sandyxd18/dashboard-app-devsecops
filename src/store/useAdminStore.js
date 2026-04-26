import { create } from 'zustand';

// JWT lives in HttpOnly cookie — never in localStorage.
// _token is kept in-memory only for injecting into other microservices (book, order, payment, blockchain).
// It is NOT persisted. On page refresh, AdminLayout calls /auth/me to re-validate the cookie
// and re-set the user. Other services calls will fail until session is restored, which happens
// before any page renders (AdminLayout blocks on isChecking).
export const useAdminStore = create((set) => ({
  user: null,
  _token: null,          // in-memory only, injected as Bearer for non-auth services
  isChecking: true,
  setUser: (user, token) => set({ user, _token: token || null, isChecking: false }),
  clearUser: () => set({ user: null, _token: null, isChecking: false }),
  setChecking: (v) => set({ isChecking: v }),
  // Convenience aliases
  login: (user, token) => set({ user, _token: token || null, isChecking: false }),
  logout: () => set({ user: null, _token: null, isChecking: false }),
}));

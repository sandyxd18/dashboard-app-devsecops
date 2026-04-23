import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  token: null,
  user: null, // expecting { username: string, id: string, role: string }
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));

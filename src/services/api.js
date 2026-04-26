import axios from 'axios';
import { useAdminStore } from '../store/useAdminStore';

// authApi — HttpOnly cookie (withCredentials: true) for session restore.
// Bearer token is ALSO injected from in-memory store so that general auth-service
// endpoints (e.g. /auth/admin/users, /auth/password) receive an explicit token.
// Since authenticateJWT checks Bearer header first, admin's token always wins
// even if both user_auth_token and admin_auth_token cookies exist in the browser.

const createApiClient = (baseURL, useCookie = false) => {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    ...(useCookie ? { withCredentials: true } : {}),
  });

  // Always inject Bearer token from admin store when available.
  client.interceptors.request.use((config) => {
    const token = useAdminStore.getState()._token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return client;
};

export const authApi   = createApiClient(import.meta.env.VITE_AUTH_API_URL, true);
export const bookApi   = createApiClient(import.meta.env.VITE_BOOK_API_URL);
export const orderApi  = createApiClient(import.meta.env.VITE_ORDER_API_URL);
export const paymentApi = createApiClient(import.meta.env.VITE_PAYMENT_API_URL);
export const blockApi  = createApiClient(import.meta.env.VITE_BLOCKCHAIN_API_URL);

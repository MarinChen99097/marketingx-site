import axios, { AxiosError, AxiosInstance } from 'axios';

const MARKETING_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marketing-backend-v2-876464738390.asia-east1.run.app';
const ZEREO_BACKEND_URL = process.env.NEXT_PUBLIC_ZEREO_URL || 'https://zereo-backend-876464738390.asia-east1.run.app';

// Module-scoped flag to suppress concurrent 401 redirects. Deliberately NOT set
// when we skip redirect (e.g. already on /auth) so the next page's interceptor
// can still fire after a successful sign-in. Resets on full page navigation.
let isRedirectingToAuth = false;

// salecraft.ai owns its own auth surface — 401 bounces users to /{locale}/auth
// with a returnUrl, and the sign-in flow lives on-site (no landingai.info hop).
function redirectToLocalAuth() {
  if (typeof window === 'undefined') return;
  if (isRedirectingToAuth) return;

  // Stale tokens are always worth clearing — a 401 means the token is dead.
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');

  const pathSegments = window.location.pathname.split('/');
  const locale = pathSegments[1] || 'en';

  // Already on /auth → skip redirect to avoid a loop. Don't set the flag.
  if (pathSegments[2] === 'auth') return;

  isRedirectingToAuth = true;
  const returnPath = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/${locale}/auth?returnUrl=${encodeURIComponent(returnPath)}`;
}

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 30000 });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // 401 interceptor: try silent refresh first, then cross-domain redirect to SSO login
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status !== 401 || typeof window === 'undefined') {
        return Promise.reject(error);
      }

      // Avoid recursing on the refresh endpoint itself
      const isRefreshRequest = error.config?.url?.includes('/auth/refresh');
      if (!isRefreshRequest) {
        try {
          const { attemptTokenRefresh } = await import('./auth-refresh');
          const newToken = await attemptTokenRefresh();
          if (newToken && error.config) {
            error.config.headers = error.config.headers ?? {};
            (error.config.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
            return client(error.config);
          }
        } catch {
          // fall through to redirect
        }
      }

      redirectToLocalAuth();
      return Promise.reject(error);
    }
  );

  return client;
}

const api = createClient(MARKETING_BACKEND_URL);
export const zereoApi = createClient(ZEREO_BACKEND_URL);

export default api;

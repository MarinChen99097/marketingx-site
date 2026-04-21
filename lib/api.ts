import axios, { AxiosError, AxiosInstance } from 'axios';

const MARKETING_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marketing-backend-v2-876464738390.asia-east1.run.app';
const ZEREO_BACKEND_URL = process.env.NEXT_PUBLIC_ZEREO_URL || 'https://zereo-backend-876464738390.asia-east1.run.app';
const LANDING_AI_URL = 'https://landingai.info';

// salecraft.ai has no /login route — auth lives on landingai.info. On 401 we
// drop the stale token and bounce the user to Landing AI's unified auth with
// returnUrl pointing back here (canonical domain, never a Cloud Run URL).
function redirectToSSOLogin() {
  if (typeof window === 'undefined') return;
  if ((window as unknown as { __401_redirecting?: boolean }).__401_redirecting) return;
  (window as unknown as { __401_redirecting?: boolean }).__401_redirecting = true;

  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');

  const locale = window.location.pathname.split('/')[1] || 'en';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://salecraft.ai';
  const returnPath = `${window.location.pathname}${window.location.search}`;
  const returnUrl = `${siteUrl}${returnPath}`;
  window.location.href = `${LANDING_AI_URL}/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`;
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

      redirectToSSOLogin();
      return Promise.reject(error);
    }
  );

  return client;
}

const api = createClient(MARKETING_BACKEND_URL);
export const zereoApi = createClient(ZEREO_BACKEND_URL);

export default api;

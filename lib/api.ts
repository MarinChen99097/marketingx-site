import axios from 'axios';

const MARKETING_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marketing-backend-v2-876464738390.asia-east1.run.app';
const ZEREO_BACKEND_URL = process.env.NEXT_PUBLIC_ZEREO_URL || 'https://zereo-backend-876464738390.asia-east1.run.app';

function createClient(baseURL: string) {
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
  return client;
}

const api = createClient(MARKETING_BACKEND_URL);
export const zereoApi = createClient(ZEREO_BACKEND_URL);

export default api;

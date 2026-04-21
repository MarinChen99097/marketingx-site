/**
 * Centralized refresh token management for marketingx-site (salecraft.ai).
 *
 * Tokens are issued by marketing-backend-v2 and shared across marketing_backend
 * and zereo_backend APIs, so a single refresh updates both clients.
 *
 * Provides:
 *  - getRefreshToken / setRefreshToken — localStorage accessors
 *  - attemptTokenRefresh — calls /auth/refresh, updates storage, returns new access token
 *  - Built-in deduplication: concurrent 401s share a single refresh promise
 */

const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marketing-backend-v2-876464738390.asia-east1.run.app';

// Deduplication: only one refresh in-flight at a time
let _refreshPromise: Promise<string | null> | null = null;

export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 *
 * - On success: updates both tokens in localStorage and returns the new access token.
 * - On failure: returns null (caller should redirect to login).
 * - Concurrent calls share a single in-flight promise (deduplication).
 */
export async function attemptTokenRefresh(): Promise<string | null> {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
        const rt = getRefreshToken();
        if (!rt) return null;
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: rt }),
            });
            if (!response.ok) return null;
            const data = await response.json();
            localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
            setRefreshToken(data.refresh_token);
            return data.access_token as string;
        } catch {
            return null;
        }
    })().finally(() => {
        _refreshPromise = null;
    });

    return _refreshPromise;
}

import api from "./api";

// Response shape from POST /auth/google (see marketing_backend/routers/auth.py:790).
// Only the fields we actually consume are typed — rest are ignored.
export interface GoogleAuthResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    user: {
        id: string | number;
        email: string;
        full_name?: string | null;
        auth_provider?: string;
        google_id?: string | null;
        [key: string]: unknown;
    };
    requires_mode_selection?: boolean;
}

// Exchange a Google ID token credential for our own JWT.
// Backend handles "first time → register+login, subsequent → login" automatically
// via the `(google_id OR email)` lookup in /auth/google. Callers are responsible
// for ToS gating before invoking this function.
export async function signInWithGoogleCredential(
    credential: string,
    opts: { sourceSite?: string } = {}
): Promise<GoogleAuthResponse> {
    const { sourceSite = "salecraft.ai" } = opts;
    const { data } = await api.post<GoogleAuthResponse>("/auth/google", {
        credential,
        source_site: sourceSite,
        terms_accepted_at: new Date().toISOString(),
    });
    return data;
}

// Persist tokens in the same shape that the legacy landingai.info SSO uses,
// so the already-whitelisted salecraft.ai entries in marketing_frontend
// (ALLOWED_REDIRECT_HOSTS) keep working if users ever hop between surfaces.
export function persistSession(session: GoogleAuthResponse) {
    if (typeof window === "undefined") return;
    localStorage.setItem("token", session.access_token);
    if (session.refresh_token) {
        localStorage.setItem("refresh_token", session.refresh_token);
    }
    try {
        localStorage.setItem(
            "user",
            JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.full_name ?? null,
                auth_provider: session.user.auth_provider ?? "google",
            })
        );
    } catch {
        /* localStorage quota / disabled — not fatal */
    }
}

export function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

export function clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
}

// Validates token by calling an authed endpoint; returns true if live.
// We probe `/settings/profile` because it's cheap and exists on marketing_backend.
export async function validateToken(): Promise<boolean> {
    const token = getStoredToken();
    if (!token) return false;
    try {
        await api.get("/settings/profile");
        return true;
    } catch {
        return false;
    }
}

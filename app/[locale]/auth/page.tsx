"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, ShieldCheck, Sparkles, ArrowLeft, UserCog } from "lucide-react";
import { LandingAILogo } from "@/components/LandingAILogo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { clearSession, getStoredToken, persistSession, signInWithGoogleCredential, validateToken } from "@/lib/auth";

const CLIENT_ID_MISSING = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Same-origin whitelist for returnUrl paths.
 * - Allow relative paths starting with /   → stay inside salecraft.ai
 * - Allow absolute URLs matching our known hosts → explicit cross-domain hop
 * Everything else is treated as hostile and replaced with a default dashboard path.
 */
const SALECRAFT_HOSTS = new Set([
    "salecraft.ai",
    "marketingx-site-s6ykq3ylca-de.a.run.app",
    "marketingx-site-876464738390.asia-east1.run.app",
]);

function safeReturnUrl(raw: string | null, locale: string): string {
    const fallback = `/${locale}/get-started`;
    if (!raw) return fallback;
    // Reject protocol-relative URLs (//evil.com/...) — these bypass the
    // "starts with /" check while actually redirecting cross-origin.
    // Same for backslash tricks (\\evil.com) some browsers accept.
    if (raw.startsWith("//") || raw.startsWith("\\")) return fallback;
    if (raw.startsWith("/")) return raw;
    try {
        const url = new URL(raw);
        return SALECRAFT_HOSTS.has(url.hostname) ? url.pathname + url.search : fallback;
    } catch {
        return fallback;
    }
}

// OIDC Implicit-flow constants for the "switch account" affordance. Using the
// canonical Google OAuth 2.0 endpoint with prompt=select_account is the only
// reliable way to force the account chooser when the browser has exactly one
// signed-in Google account — GIS's renderButton short-circuits in that case
// and the previously-tried AccountChooser/AddSession URLs are deprecated.
//
// REDIRECT URI: this URL must be registered in the OAuth client's
// "Authorized redirect URIs" list (GCP Console → APIs & Services → Credentials).
// We use the current locale's /auth path so the same component handles the
// redirect-back leg by parsing window.location.hash for #id_token=…
const OIDC_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const OIDC_RETURN_KEY = "salecraft.oidcReturnPath";
const OIDC_STATE_KEY = "salecraft.oidcState";
const OIDC_NONCE_KEY = "salecraft.oidcNonce";

function randomToken(): string {
    // crypto.randomUUID is available on every browser we ship to (last 4 yrs).
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Fallback for ancient environments — still adequate as a CSRF token.
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AuthInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const t = useTranslations("Auth");

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [probing, setProbing] = useState(true);

    const returnPath = safeReturnUrl(searchParams.get("returnUrl"), locale);
    // Switch-account mode: get-started's logout redirects here with ?switch=1.
    // We must NOT auto-redirect even if a stale token survives, and the GIS
    // button must offer a real escape from the previously-signed-in account.
    const switchMode = searchParams.get("switch") === "1";

    // Handle the OAuth Implicit redirect-back leg. Google appends
    // #id_token=…&state=…&… to our redirect_uri after the user picks an
    // account. We validate state/nonce against sessionStorage, then feed
    // the ID token into the same /auth/google backend endpoint that GIS uses.
    const handleOidcCallback = useCallback(async () => {
        if (typeof window === "undefined") return false;
        if (!window.location.hash || !window.location.hash.includes("id_token=")) {
            return false;
        }

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const idToken = hashParams.get("id_token");
        const returnedState = hashParams.get("state");
        const oauthError = hashParams.get("error");

        // Always strip the hash so a refresh doesn't re-trigger sign-in.
        window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
        );

        if (oauthError) {
            setError(t("errorGeneric"));
            return true;
        }

        const expectedState = sessionStorage.getItem(OIDC_STATE_KEY);
        const storedReturn = sessionStorage.getItem(OIDC_RETURN_KEY);
        sessionStorage.removeItem(OIDC_STATE_KEY);
        sessionStorage.removeItem(OIDC_NONCE_KEY);
        sessionStorage.removeItem(OIDC_RETURN_KEY);

        if (!idToken || !returnedState || returnedState !== expectedState) {
            setError(t("errorGeneric"));
            return true;
        }

        setLoading(true);
        try {
            const session = await signInWithGoogleCredential(idToken, {
                sourceSite: "salecraft.ai",
            });
            persistSession(session);
            const dest = storedReturn && storedReturn.startsWith("/") ? storedReturn : returnPath;
            router.replace(dest);
        } catch (e) {
            const message = (e as { response?: { status?: number } })?.response?.status === 503
                ? t("errorBackend")
                : t("errorGeneric");
            setError(message);
            setLoading(false);
        }
        return true;
    }, [router, returnPath, t]);

    // Trigger OIDC Implicit flow with prompt=select_account. Same-window
    // redirect; Google bounces back to redirect_uri with #id_token=… on
    // success. We rely on Google's chooser UI for actual account picking,
    // which works regardless of how many accounts are signed into the browser.
    //
    // Gate on termsAccepted to mirror the GIS handler — a brand-new Google
    // account picked here will be auto-registered by /auth/google, so we
    // need explicit ToS consent before the redirect leaves the page.
    const triggerSwitchAccount = useCallback(() => {
        if (typeof window === "undefined") return;
        if (!termsAccepted) {
            setError(t("errorTermsRequired"));
            return;
        }
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            setError(t("errorGeneric"));
            return;
        }
        const state = randomToken();
        const nonce = randomToken();
        sessionStorage.setItem(OIDC_STATE_KEY, state);
        sessionStorage.setItem(OIDC_NONCE_KEY, nonce);
        sessionStorage.setItem(OIDC_RETURN_KEY, returnPath);

        // redirect_uri must match a registered URI exactly (no query, no hash).
        const redirectUri = `${window.location.origin}/${locale}/auth`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "id_token",
            scope: "openid email profile",
            prompt: "select_account",
            // Localize Google's chooser UI to match the page's locale.
            hl: locale,
            nonce,
            state,
        });
        window.location.href = `${OIDC_AUTH_ENDPOINT}?${params.toString()}`;
    }, [locale, returnPath, t, termsAccepted]);

    // Already signed in → skip the UI and redirect. Short-circuit when no
    // token is stored so first-time visitors don't pay a network round-trip.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            // OIDC redirect-back has top priority — handle the hash before any
            // session/redirect logic so the new credential wins over any stale
            // local token.
            const handled = await handleOidcCallback();
            if (cancelled || handled) {
                if (handled) setProbing(false);
                return;
            }
            // Switch mode: nuke any leftover session and stay on the form so the
            // user can pick a different Google account. Without this, a stale
            // token (e.g. from a parallel tab that re-issued one) would silently
            // bounce them back to the same account they're trying to leave.
            if (switchMode) {
                clearSession();
                setProbing(false);
                return;
            }
            if (!getStoredToken()) {
                setProbing(false);
                return;
            }
            const live = await validateToken();
            if (cancelled) return;
            if (live) {
                router.replace(returnPath);
                return;
            }
            setProbing(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [router, returnPath, switchMode, handleOidcCallback]);

    const handleGoogleCredential = async (credential: string) => {
        if (loading) return;
        if (!termsAccepted) {
            setError(t("errorTermsRequired"));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const session = await signInWithGoogleCredential(credential, {
                sourceSite: "salecraft.ai",
            });
            persistSession(session);
            router.replace(returnPath);
        } catch (e) {
            const message = (e as { response?: { status?: number } })?.response?.status === 503
                ? t("errorBackend")
                : t("errorGeneric");
            setError(message);
            setLoading(false);
        }
    };

    const handleGoogleError = (msg: string) => {
        setError(msg || t("errorNoCredential"));
    };

    if (probing) {
        return (
            <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
            {/* GIS loader — scoped to /auth so it doesn't bloat every page. */}
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            {/* Top bar */}
            <nav className="px-5 sm:px-8 py-4 flex justify-between items-center">
                <Link href={`/${locale}`} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-[hsl(16,70%,56%)] to-[hsl(16,80%,45%)] rounded-lg flex items-center justify-center shadow-lg shadow-[hsl(16,70%,56%)]/20">
                        <LandingAILogo size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">SaleCraft</span>
                </Link>
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("back")}
                </Link>
            </nav>

            {/* Ambient orange glow */}
            <div className="relative flex-1 flex items-center justify-center px-4 overflow-hidden">
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[hsl(16,70%,56%)]/10 via-transparent to-transparent rounded-full blur-[140px]" />

                {/* Main card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm p-8 md:p-10 shadow-2xl shadow-black/50">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(16,70%,56%)]/10 border border-[hsl(16,70%,56%)]/20 mb-5">
                                {switchMode ? (
                                    <UserCog className="w-6 h-6 text-[hsl(16,70%,60%)]" />
                                ) : (
                                    <Sparkles className="w-6 h-6 text-[hsl(16,70%,60%)]" />
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 [word-break:keep-all]">
                                {switchMode ? t("switchTitle") : t("title")}
                            </h1>
                            <p className="text-sm text-white/50 leading-relaxed">
                                {switchMode ? t("switchSubtitle") : t("subtitle")}
                            </p>
                        </div>

                        {/* ToS checkbox */}
                        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => {
                                    setTermsAccepted(e.target.checked);
                                    if (e.target.checked) setError(null);
                                }}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[hsl(16,70%,56%)] focus:ring-[hsl(16,70%,56%)]/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-white/60 leading-relaxed select-none">
                                {t("agree")}{" "}
                                <Link
                                    href={`/${locale}/terms`}
                                    className="text-[hsl(16,70%,60%)] hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("terms")}
                                </Link>
                                {" "}{t("and")}{" "}
                                <Link
                                    href={`/${locale}/privacy`}
                                    className="text-[hsl(16,70%,60%)] hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("privacy")}
                                </Link>
                                {!termsAccepted && (
                                    <span className="block text-xs text-white/30 mt-1">{t("agreeHint")}</span>
                                )}
                            </span>
                        </label>

                        {/* Google Sign-In */}
                        <div className="flex flex-col items-center gap-4">
                            {CLIENT_ID_MISSING ? (
                                <div className="w-full p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/80 text-center">
                                    Google sign-in is not yet configured on this deployment. Set{" "}
                                    <code className="font-mono text-amber-300">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
                                    and redeploy.
                                </div>
                            ) : (
                                <GoogleSignInButton
                                    onSuccess={handleGoogleCredential}
                                    onError={handleGoogleError}
                                    disabled={!termsAccepted || loading}
                                    locale={locale}
                                    theme="filled_black"
                                    text="continue_with"
                                    forceAccountChooser={switchMode}
                                />
                            )}

                            {loading && (
                                <div className="flex items-center gap-2 text-sm text-white/50">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t("loadingAuth")}
                                </div>
                            )}
                            {error && (
                                <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300 text-center">
                                    {error}
                                </div>
                            )}

                            {/* Switch-mode escape hatch: forces Google's account
                                chooser via the OIDC Implicit endpoint with
                                prompt=select_account. This is the canonical
                                spec-defined way to bypass GIS's "single signed-
                                in account" short-circuit. The redirect_uri
                                (`${origin}/${locale}/auth`) must be registered
                                in the OAuth client's Authorized redirect URIs. */}
                            {switchMode && !CLIENT_ID_MISSING && (
                                <button
                                    type="button"
                                    onClick={triggerSwitchAccount}
                                    disabled={loading || !termsAccepted}
                                    className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                                >
                                    {t("switchToAnotherAccountLink")}
                                </button>
                            )}
                        </div>

                        {/* Footer hints */}
                        <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-2 text-center">
                            <p className="text-xs text-white/40 flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-400/60" />
                                {t("firstTimeHint")}
                            </p>
                            <p className="text-xs text-white/30">{t("existingHint")}</p>
                        </div>
                    </div>

                    {/* Support line */}
                    <p className="text-center text-xs text-white/30 mt-6">
                        {t("contactSupport")}{" "}
                        <a
                            href={`mailto:${t("supportEmail")}`}
                            className="text-white/50 hover:text-white/70 underline"
                        >
                            {t("supportEmail")}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                </div>
            }
        >
            <AuthInner />
        </Suspense>
    );
}

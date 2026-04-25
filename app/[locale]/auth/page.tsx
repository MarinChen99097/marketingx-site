"use client";

import { Suspense, useEffect, useState } from "react";
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

    // Already signed in → skip the UI and redirect. Short-circuit when no
    // token is stored so first-time visitors don't pay a network round-trip.
    useEffect(() => {
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
        let cancelled = false;
        (async () => {
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
    }, [router, returnPath, switchMode]);

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

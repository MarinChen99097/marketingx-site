"use client";

import React, { useEffect, useCallback, useRef } from "react";

// TypeScript declarations for Google Identity Services.
// Loaded by the site-wide <Script> tag in app/[locale]/layout.tsx.
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleIdConfig) => void;
                    renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
                    prompt: () => void;
                    disableAutoSelect: () => void;
                };
            };
        };
    }
}

interface GoogleIdConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    type?: "standard" | "icon";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    width?: string | number;
    locale?: string;
}

interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
}

interface GoogleSignInButtonProps {
    onSuccess: (credential: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    locale?: string;
    theme?: "outline" | "filled_blue" | "filled_black";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    /**
     * Switch-account mode. When true, calls `google.accounts.id.disableAutoSelect()`
     * after init so GIS won't silently re-sign-in with the previously-used
     * account on the next One Tap cycle. The /auth page additionally renders
     * a "Use a different Google account" link as a hard escape hatch when
     * this is true (GIS button click STILL shortcuts to the only signed-in
     * browser account on some setups).
     */
    forceAccountChooser?: boolean;
}

export function GoogleSignInButton({
    onSuccess,
    onError,
    disabled = false,
    locale,
    theme = "filled_black",
    text = "continue_with",
    forceAccountChooser = false,
}: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    const handleCredentialResponse = useCallback(
        (response: GoogleCredentialResponse) => {
            if (response.credential) {
                onSuccess(response.credential);
            } else {
                onError?.("Google sign-in failed: No credential received");
            }
        },
        [onSuccess, onError]
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        // GIS client IDs are origin-scoped — localhost won't work without explicit setup.
        const isLocalhost =
            window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocalhost) return;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("[GoogleSignIn] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
            onError?.("Google sign-in is not configured on this site.");
            return;
        }

        initializedRef.current = false;
        if (buttonRef.current) buttonRef.current.innerHTML = "";

        const initializeGoogle = () => {
            if (!window.google?.accounts?.id) return;
            if (!buttonRef.current) return;

            try {
                buttonRef.current.innerHTML = "";
                initializedRef.current = false;

                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                // Switch-account: explicitly clear GIS's "remembered" auto-select
                // state. Without this, even with auto_select:false, GIS may still
                // bias the popup toward the last-used account on this origin.
                if (forceAccountChooser) {
                    try {
                        window.google.accounts.id.disableAutoSelect();
                    } catch (err) {
                        console.warn("[GoogleSignIn] disableAutoSelect failed:", err);
                    }
                }

                window.google.accounts.id.renderButton(buttonRef.current, {
                    theme,
                    size: "large",
                    type: "standard",
                    text,
                    shape: "rectangular",
                    width: "320",
                    locale: locale || "en",
                });

                initializedRef.current = true;
            } catch (error) {
                console.error("[GoogleSignIn] Failed to initialize:", error);
            }
        };

        // Poll for GIS script readiness; give up after 10 s. Both timers must
        // be tracked so unmount cancels them (otherwise the interval keeps
        // polling against a dead component).
        let checkInterval: ReturnType<typeof setInterval> | null = null;
        let giveUpTimeout: ReturnType<typeof setTimeout> | null = null;
        if (window.google?.accounts?.id) {
            initializeGoogle();
        } else {
            checkInterval = setInterval(() => {
                if (window.google?.accounts?.id && checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                    initializeGoogle();
                }
            }, 100);
            giveUpTimeout = setTimeout(() => {
                if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                }
            }, 10000);
        }

        // Re-render the button when the tab regains focus — fixes GIS sometimes
        // disabling the button iframe after an OAuth cancel round-trip.
        const onFocus = () => {
            if (window.google?.accounts?.id && buttonRef.current) {
                setTimeout(initializeGoogle, 300);
            }
        };
        window.addEventListener("focus", onFocus);
        return () => {
            window.removeEventListener("focus", onFocus);
            if (checkInterval) clearInterval(checkInterval);
            if (giveUpTimeout) clearTimeout(giveUpTimeout);
        };
    }, [handleCredentialResponse, locale, onError, theme, text, forceAccountChooser]);

    return (
        <div
            ref={buttonRef}
            className={`flex justify-center ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            style={{ minHeight: "44px", width: "320px", maxWidth: "100%" }}
        />
    );
}

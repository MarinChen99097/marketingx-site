"use client";

import React, { useEffect, useCallback, useRef } from "react";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleIdConfig) => void;
                    renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
                    prompt: () => void;
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
}

export function GoogleSignInButton({
    onSuccess,
    onError,
    disabled = false,
    locale,
}: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleCredentialResponse = useCallback(
        (response: GoogleCredentialResponse) => {
            if (response.credential) onSuccess(response.credential);
            else onError?.("Google sign-in failed: No credential received");
        },
        [onSuccess, onError],
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        if (isLocalhost) return;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("[GoogleSignIn] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
            return;
        }

        // Load Google Identity Services script once. Unlike
        // marketing_frontend_commercial, marketingx_site's layout does not
        // already include it.
        const GSI_SRC = "https://accounts.google.com/gsi/client";
        if (!document.querySelector(`script[src="${GSI_SRC}"]`)) {
            const s = document.createElement("script");
            s.src = GSI_SRC;
            s.async = true;
            s.defer = true;
            document.head.appendChild(s);
        }

        const init = () => {
            if (!window.google?.accounts?.id || !buttonRef.current) return;
            buttonRef.current.innerHTML = "";
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: "outline",
                size: "large",
                type: "standard",
                text: "continue_with",
                shape: "rectangular",
                width: "100%",
                locale: locale || "en",
            });
        };

        if (window.google?.accounts?.id) {
            init();
        } else {
            const timer = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(timer);
                    init();
                }
            }, 120);
            setTimeout(() => clearInterval(timer), 10000);
        }
    }, [handleCredentialResponse, locale]);

    return (
        <div
            ref={buttonRef}
            className={`w-full flex justify-center ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            style={{ minHeight: "44px" }}
        />
    );
}

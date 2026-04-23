"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SalecraftLogo } from "@/components/SalecraftLogo";

const MARKETING_BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://marketing-backend-v2-876464738390.asia-east1.run.app";

// Localized strings without adding a new next-intl namespace. Copy is
// deliberately terse — the salecraft.ai login surface is meant to be
// single-screen, single-decision.
const COPY = {
    "zh-TW": {
        heading: "登入 salecraft",
        subtitle: "首次使用將自動建立帳號",
        termsPrefix: "我已閱讀並同意 salecraft 的",
        terms: "服務條款",
        and: "與",
        privacy: "隱私權政策",
        termsRequired: "請先同意服務條款與隱私權政策",
        googleAuthFailed: "Google 登入失敗，請稍後再試。",
        emailExistsPassword:
            "此 Email 已用密碼註冊。請到救援流程綁定 Google 帳號。",
        notWhitelisted: "此帳號目前不在開放名單內。",
        accountPendingDeletion: "此帳戶已排定刪除，請檢查 Email 取消刪除。",
        haveOldAccount: "有舊密碼帳號？",
        recoverLink: "綁定 Google 帳號",
    },
    "zh-CN": {
        heading: "登录 salecraft",
        subtitle: "首次使用将自动创建账号",
        termsPrefix: "我已阅读并同意 salecraft 的",
        terms: "服务条款",
        and: "与",
        privacy: "隐私权政策",
        termsRequired: "请先同意服务条款与隐私权政策",
        googleAuthFailed: "Google 登录失败，请稍后再试。",
        emailExistsPassword:
            "此 Email 已用密码注册。请到救援流程绑定 Google 账号。",
        notWhitelisted: "此账号目前不在开放名单内。",
        accountPendingDeletion: "此账户已计划删除，请检查 Email 取消删除。",
        haveOldAccount: "有旧密码账号？",
        recoverLink: "绑定 Google 账号",
    },
    en: {
        heading: "Sign in to salecraft",
        subtitle: "First-time users will be registered automatically",
        termsPrefix: "I have read and agree to salecraft's",
        terms: "Terms of Service",
        and: "and",
        privacy: "Privacy Policy",
        termsRequired:
            "Please accept the Terms of Service and Privacy Policy first",
        googleAuthFailed: "Google sign-in failed. Please try again later.",
        emailExistsPassword:
            "This email is already registered with a password. Use the recovery flow to link your Google account.",
        notWhitelisted: "This account is not yet whitelisted.",
        accountPendingDeletion:
            "This account is scheduled for deletion. Check your email to cancel.",
        haveOldAccount: "Have an existing password account?",
        recoverLink: "Link Google account",
    },
} as const;

function parseErrorCode(err: unknown): string | null {
    const detail = (err as AxiosError<{ detail?: { code?: string } | string }>)?.response
        ?.data?.detail;
    if (detail && typeof detail === "object" && "code" in detail) {
        return detail.code ?? null;
    }
    return null;
}

function SalecraftLoginPanel() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const copy: (typeof COPY)[keyof typeof COPY] =
        (COPY as Record<string, (typeof COPY)[keyof typeof COPY]>)[locale] ?? COPY.en;

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    const returnUrl = searchParams.get("returnUrl");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("token");
        if (!token) return;
        if (returnUrl && returnUrl.startsWith("/")) {
            router.push(returnUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleSuccess = async (credential: string) => {
        if (!termsAccepted) {
            setError(copy.termsRequired);
            return;
        }
        setGoogleLoading(true);
        setError("");
        try {
            const resp = await axios.post(
                `${MARKETING_BACKEND_URL}/auth/google`,
                {
                    credential,
                    timezone:
                        (typeof Intl !== "undefined" &&
                            Intl.DateTimeFormat().resolvedOptions().timeZone) ||
                        null,
                },
                { timeout: 30000 },
            );
            const token = resp.data.access_token;
            const refreshToken = resp.data.refresh_token;
            if (token) localStorage.setItem("token", token);
            if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
            if (returnUrl && returnUrl.startsWith("/")) router.push(returnUrl);
            else router.push(`/${locale}`);
        } catch (err) {
            const code = parseErrorCode(err);
            if (code === "EMAIL_EXISTS_PASSWORD_USER") setError(copy.emailExistsPassword);
            else if (code === "NOT_WHITELISTED") setError(copy.notWhitelisted);
            else if (code === "ACCOUNT_PENDING_DELETION")
                setError(copy.accountPendingDeletion);
            else setError(copy.googleAuthFailed);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleError = () => setError(copy.googleAuthFailed);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            <div className="w-full max-w-sm p-6 sm:p-8 relative z-10">
                <div className="bg-card border border-border/40 rounded-2xl shadow-lg p-8 space-y-6">
                    <div className="flex flex-col items-center space-y-3">
                        <SalecraftLogo size={36} showText={true} textClassName="text-xl" />
                        <h1 className="text-xl font-semibold tracking-tight text-foreground text-center">
                            {copy.heading}
                        </h1>
                        <p className="text-sm text-muted-foreground text-center">
                            {copy.subtitle}
                        </p>
                    </div>

                    <label className="flex items-start gap-3 text-sm text-foreground/90 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="leading-relaxed">
                            {copy.termsPrefix}{" "}
                            <Link
                                href={`/${locale}/terms`}
                                target="_blank"
                                className="text-primary hover:underline"
                            >
                                {copy.terms}
                            </Link>{" "}
                            {copy.and}{" "}
                            <Link
                                href={`/${locale}/privacy`}
                                target="_blank"
                                className="text-primary hover:underline"
                            >
                                {copy.privacy}
                            </Link>
                            。
                        </span>
                    </label>

                    <div
                        className={
                            (!termsAccepted || googleLoading
                                ? "opacity-50 pointer-events-none "
                                : "") +
                            "rounded-xl border border-border/40 bg-background/60 p-4"
                        }
                    >
                        {googleLoading ? (
                            <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ...
                            </div>
                        ) : (
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                disabled={!termsAccepted || googleLoading}
                                locale={locale}
                            />
                        )}
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3"
                        >
                            {error}
                        </div>
                    )}

                    <div className="pt-2 text-center text-xs text-muted-foreground">
                        {copy.haveOldAccount}{" "}
                        <Link href={`/${locale}/recover`} className="text-primary hover:underline">
                            {copy.recoverLink}
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    <a href="mailto:support@salecraft.ai" className="text-primary hover:underline">
                        support@salecraft.ai
                    </a>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <SalecraftLoginPanel />
        </Suspense>
    );
}

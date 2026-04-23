"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import axios, { AxiosError } from "axios";
import { Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SalecraftLogo } from "@/components/SalecraftLogo";

const MARKETING_BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://marketing-backend-v2-876464738390.asia-east1.run.app";

const COPY = {
    "zh-TW": {
        heading: "綁定 Google 帳號",
        subtitle: "先用原本的密碼登入，再綁定 Google 帳號",
        stepLogin: "Step 1：密碼登入",
        stepLink: "Step 2：綁定 Google 帳號",
        email: "電子郵件",
        password: "密碼",
        login: "登入",
        loginFailed: "電子郵件或密碼錯誤",
        linkNote: "綁定成功後，未來可以直接用 Google 登入。",
        googleAuthFailed: "Google 綁定失敗，請稍後再試。",
        emailMismatch: "Google 帳號 Email 必須和原帳號一致。",
        googleAlreadyLinked: "此 Google 帳號已被其他用戶綁定。",
        back: "返回登入",
        success: "綁定成功，正在帶您回到 salecraft。",
    },
    "zh-CN": {
        heading: "绑定 Google 账号",
        subtitle: "先用原本的密码登录，再绑定 Google 账号",
        stepLogin: "Step 1：密码登录",
        stepLink: "Step 2：绑定 Google 账号",
        email: "电子邮件",
        password: "密码",
        login: "登录",
        loginFailed: "电子邮件或密码错误",
        linkNote: "绑定成功后，未来可以直接用 Google 登录。",
        googleAuthFailed: "Google 绑定失败，请稍后再试。",
        emailMismatch: "Google 账号 Email 必须和原账号一致。",
        googleAlreadyLinked: "此 Google 账号已被其他用户绑定。",
        back: "返回登录",
        success: "绑定成功，正在带您回到 salecraft。",
    },
    en: {
        heading: "Link Google account",
        subtitle: "Sign in with your password first, then link Google",
        stepLogin: "Step 1: Sign in with password",
        stepLink: "Step 2: Link Google account",
        email: "Email",
        password: "Password",
        login: "Sign in",
        loginFailed: "Invalid email or password",
        linkNote: "Once linked, you can sign in with Google directly.",
        googleAuthFailed: "Failed to link Google. Please try again.",
        emailMismatch: "The Google account email must match your current account.",
        googleAlreadyLinked:
            "This Google account is already linked to another user.",
        back: "Back to sign in",
        success: "Linked successfully. Redirecting...",
    },
} as const;

function parseErrorCode(err: unknown): string | null {
    const detail = (err as AxiosError<{ detail?: { code?: string } | string }>)?.response
        ?.data?.detail;
    if (detail && typeof detail === "object" && "code" in detail) return detail.code ?? null;
    return null;
}

function RecoverFlow() {
    const router = useRouter();
    const locale = useLocale();
    const copy: (typeof COPY)[keyof typeof COPY] =
        (COPY as Record<string, (typeof COPY)[keyof typeof COPY]>)[locale] ?? COPY.en;

    const [step, setStep] = useState<"login" | "link">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const form = new URLSearchParams();
            form.append("username", email);
            form.append("password", password);
            const resp = await axios.post(
                `${MARKETING_BACKEND_URL}/auth/token`,
                form,
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    timeout: 30000,
                },
            );
            const token = resp.data.access_token;
            const refreshToken = resp.data.refresh_token;
            if (token) localStorage.setItem("token", token);
            if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
            setStep("link");
        } catch {
            setError(copy.loginFailed);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setGoogleLoading(true);
        setError("");
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const resp = await axios.post(
                `${MARKETING_BACKEND_URL}/auth/link-google`,
                { credential },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    timeout: 30000,
                },
            );
            const newToken = resp.data.access_token;
            const newRefresh = resp.data.refresh_token;
            if (newToken) localStorage.setItem("token", newToken);
            if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
            setInfo(copy.success);
            setTimeout(() => router.push(`/${locale}`), 1200);
        } catch (err) {
            const code = parseErrorCode(err);
            if (code === "EMAIL_MISMATCH") setError(copy.emailMismatch);
            else if (code === "GOOGLE_ALREADY_LINKED") setError(copy.googleAlreadyLinked);
            else setError(copy.googleAuthFailed);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="w-full max-w-sm p-6 sm:p-8">
                <div className="bg-card border border-border/40 rounded-2xl shadow-lg p-8 space-y-6">
                    <div className="flex flex-col items-center space-y-3">
                        <SalecraftLogo size={32} showText={true} />
                        <h1 className="text-lg font-semibold tracking-tight text-foreground text-center">
                            {copy.heading}
                        </h1>
                        <p className="text-sm text-muted-foreground text-center">
                            {copy.subtitle}
                        </p>
                    </div>

                    {step === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                {copy.stepLogin}
                            </p>
                            <label className="block space-y-1 text-sm">
                                <span className="text-foreground/80">{copy.email}</span>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full h-10 pl-10 pr-3 rounded-md border border-border/60 bg-background/70 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </label>
                            <label className="block space-y-1 text-sm">
                                <span className="text-foreground/80">{copy.password}</span>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full h-10 pl-10 pr-3 rounded-md border border-border/60 bg-background/70 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </label>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 flex items-center justify-center"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {copy.login}
                            </button>
                        </form>
                    )}

                    {step === "link" && (
                        <div className="space-y-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                {copy.stepLink}
                            </p>
                            <p className="text-sm text-muted-foreground">{copy.linkNote}</p>
                            <div
                                className={
                                    (googleLoading ? "opacity-50 pointer-events-none " : "") +
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
                                        disabled={googleLoading}
                                        locale={locale}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3"
                        >
                            {error}
                        </div>
                    )}
                    {info && (
                        <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-md p-3">
                            {info}
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            href={`/${locale}/login`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            {copy.back}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RecoverPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <RecoverFlow />
        </Suspense>
    );
}

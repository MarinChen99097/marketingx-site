"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Bot, Facebook, HardDrive, CreditCard,
  ArrowRight, CheckCircle, ExternalLink,
  Copy, Check, Sparkles, LogOut, Loader2
} from "lucide-react";
import { LandingAILogo } from "@/components/LandingAILogo";
import { Button } from "@/components/ui/button";
import api, { zereoApi } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════
 * ACTION CARD
 * ═══════════════════════════════════════════════════════════════════ */
function ActionCard({ step, icon: Icon, title, description, status, children, delay }: {
  step: number; icon: React.ElementType; title: string; description: string;
  status: "ready" | "connected" | "pending"; children: React.ReactNode; delay: number;
}) {
  const t = useTranslations("GetStarted");
  const badges: Record<string, { label: string; cls: string }> = {
    ready: { label: t("status.ready"), cls: "border-white/10 bg-white/[0.04] text-white/50" },
    connected: { label: t("status.connected"), cls: "border-green-500/20 bg-green-500/10 text-green-400" },
    pending: { label: t("status.pending"), cls: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400" },
  };
  const badge = badges[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300 overflow-hidden"
    >
      <div className="p-6 md:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(16,70%,56%)]/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-[hsl(16,70%,56%)]" />
            </div>
            <div>
              <div className="text-xs text-white/30 font-medium mb-1 font-mono">STEP {step}</div>
              <h3 className="text-base md:text-lg font-bold text-white">{title}</h3>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0 ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-sm text-white/45 leading-relaxed">{description}</p>
        <div className="pt-1">{children}</div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════ */
export default function GetStartedPage() {
  const locale = useLocale();
  const t = useTranslations("GetStarted");
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userCredits, setUserCredits] = useState(0);
  const [copied, setCopied] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const LANDING_AI_URL = "https://landingai.info";
  const PLUGIN_CMD = `Generate a landing page for me with this plugin\nhttps://github.com/MarinChen99097/marketingx.plugin`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // ── 1. Accept token from Landing AI SSO redirect (#token=xxx) ──
    if (hash.includes("token=")) {
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch?.[1]) {
        localStorage.setItem("token", tokenMatch[1]);
        const rt = params.get("__rt");
        if (rt) localStorage.setItem("refresh_token", rt);
        window.history.replaceState(null, "", `/${locale}/get-started`);
      }
    }

    // ── 2. Handle OAuth callback (?code=xxx&state=xxx) ──
    const oauthCode = params.get("code");
    const oauthState = params.get("state");
    const oauthScope = params.get("scope") || "";
    if (oauthCode && !params.get("topup") && localStorage.getItem("token")) {
      const exchangeCode = async () => {
        const redirectUri = `${window.location.origin}/${locale}/get-started`;
        if (oauthScope.includes("drive") || oauthScope.includes("googleapis")) {
          // Google Drive OAuth callback
          try {
            await api.post("/ai-agent/gdrive/auth-callback", {
              code: oauthCode,
              redirect_uri: redirectUri,
            });
            setGoogleConnected(true);
          } catch (err) {
            console.error("[GetStarted] Google Drive callback failed:", err);
          }
        } else {
          // Meta OAuth callback
          try {
            await zereoApi.post("/social/accounts/meta/callback", {
              code: oauthCode,
              redirect_uri: redirectUri,
              state: oauthState || "",
            });
            setMetaConnected(true);
          } catch (err) {
            console.error("[GetStarted] Meta callback failed:", err);
          }
        }
        window.history.replaceState(null, "", `/${locale}/get-started`);
      };
      // Must await before fetchProfile runs
      exchangeCode().then(() => {});
      // Skip fetchProfile/checkMeta below — exchangeCode already sets state
      return;
    }

    // ── 3. Handle Stripe success (?topup=success) ──
    if (params.get("topup") === "success") {
      window.history.replaceState(null, "", `/${locale}/get-started`);
    }

    // ── 4. No token → redirect to register ──
    const token = localStorage.getItem("token");
    if (!token) {
      const siteUrl = window.location.origin;
      window.location.href = `https://landingai.info/${locale}/register?returnUrl=${encodeURIComponent(`${siteUrl}/${locale}/get-started`)}`;
      return;
    }
    setIsLoggedIn(true);

    // ── 5. Fetch profile + check connections ──
    const fetchProfile = async () => {
      try {
        const res = await api.get("/settings/profile");
        setUserEmail(res.data.email || "");
        setUserCredits(res.data.credits || 0);
        if (res.data.google_id) setGoogleConnected(true);
      } catch (err) {
        console.error("[GetStarted] profile fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    // Check GDrive connection status
    const checkGDrive = async () => {
      try {
        const res = await api.get("/ai-agent/gdrive/status");
        if (res.data?.connections?.length > 0 || res.data?.google_email) {
          setGoogleConnected(true);
        }
      } catch { /* endpoint may not exist */ }
    };

    const checkMeta = async () => {
      try {
        const res = await zereoApi.get("/social/accounts/");
        const accounts = res.data?.accounts || res.data || [];
        if (Array.isArray(accounts) && accounts.some((a: any) =>
          a.platform === "meta" || a.platform === "facebook" || a.platform === "instagram"
        )) setMetaConnected(true);
      } catch { /* endpoint may not exist yet */ }
    };

    fetchProfile();
    checkMeta();
    checkGDrive();
  }, [locale, router]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(PLUGIN_CMD); } catch {
      const el = document.createElement("textarea"); el.value = PLUGIN_CMD;
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMetaConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/${locale}/get-started`;
      const res = await zereoApi.get("/social/accounts/meta/auth-url", {
        params: { redirect_uri: redirectUri },
      });
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
        return;
      }
    } catch (err) {
      console.error("[GetStarted] Meta auth error:", err);
    }
    alert("Meta 連結暫時無法使用，請稍後再試");
  };

  const handleGoogleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/${locale}/get-started`;
      const res = await api.post("/ai-agent/gdrive/auth-url", {
        redirect_uri: redirectUri,
      });
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
        return;
      }
    } catch (err) {
      console.error("[GetStarted] Google Drive auth error:", err);
    }
    alert("Google 連結暫時無法使用，請稍後再試");
  };

  const handleStripeTopup = async () => {
    try {
      const res = await api.post("/pricing/checkout", {
        amount_usd: 20,
        success_url: `${window.location.origin}/${locale}/get-started?topup=success`,
        cancel_url: `${window.location.origin}/${locale}/get-started`,
      });
      if (res.data?.checkout_url) { window.location.href = res.data.checkout_url; return; }
    } catch (err) { console.error("[GetStarted] Stripe error:", err); }
    window.location.href = `https://landingai.info/${locale}/account/billing`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    router.push(`/${locale}/marketingx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(16,70%,56%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">

      {/* ════════════ NAVBAR ════════════ */}
      <nav className="px-5 sm:px-8 py-4 flex justify-between items-center border-b border-white/[0.06] sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl">
        <Link href={`/${locale}/marketingx`} className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[hsl(16,70%,56%)] to-[hsl(16,80%,45%)] rounded-lg flex items-center justify-center shadow-lg shadow-[hsl(16,70%,56%)]/20">
            <LandingAILogo size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">MarketingX</span>
        </Link>

        <div className="flex gap-2 md:gap-3 items-center">
          {userEmail && (
            <span className="hidden md:inline text-sm text-white/40 truncate max-w-[180px]">{userEmail}</span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(16,70%,56%)]/20 bg-[hsl(16,70%,56%)]/5 text-[hsl(16,70%,56%)] text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{userCredits} pts</span>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={handleLogout}
            className="text-white/40 hover:text-white hover:bg-white/[0.06] h-9 w-9 p-0 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* ════════════ WELCOME HEADER ════════════ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>{t("welcome.badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            {t("welcome.title1")}
            <span className="bg-gradient-to-r from-[hsl(16,70%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">
              MarketingX
            </span>
          </h1>
          <p className="text-white/40 text-sm md:text-base max-w-md mx-auto">
            {t("welcome.subtitle")}
          </p>
        </motion.div>
      </div>

      {/* ════════════ 4 ACTION CARDS ════════════ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 md:pb-24 space-y-4">

        {/* 1. Claude Plugin */}
        <ActionCard
          step={1} icon={Bot}
          title={t("step1.title")}
          description={t("step1.desc")}
          status={copied ? "connected" : "ready"} delay={0.1}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="text-[10px] text-white/20 ml-2 font-mono">Claude Code</span>
              </div>
              <div className="font-mono text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-wrap break-all">
                <span className="text-[hsl(16,70%,60%)]">&#10095;</span> Generate a landing page for me with this plugin{"\n"}
                <span className="text-blue-400">https://github.com/MarinChen99097/marketingx.plugin</span>
              </div>
            </div>
            <Button
              onClick={handleCopy}
              className="w-full sm:w-auto h-10 px-6 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-medium rounded-xl text-sm shadow-lg shadow-[hsl(16,70%,56%)]/20"
            >
              {copied ? <><Check className="mr-2 w-4 h-4" /> {t("step1.copiedBtn")}</> : <><Copy className="mr-2 w-4 h-4" /> {t("step1.copyBtn")}</>}
            </Button>
          </div>
        </ActionCard>

        {/* 2. Meta (FB/IG) */}
        <ActionCard
          step={2} icon={Facebook}
          title={t("step2.title")}
          description={t("step2.desc")}
          status={metaConnected ? "connected" : "ready"} delay={0.2}
        >
          {metaConnected ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{t("step2.connected")}</span>
            </div>
          ) : (
            <Button
              onClick={handleMetaConnect}
              className="w-full sm:w-auto h-10 px-6 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-xl text-sm"
            >
              <Facebook className="mr-2 w-4 h-4" />
              {t("step2.btn")}
              <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-60" />
            </Button>
          )}
        </ActionCard>

        {/* 3. Google */}
        <ActionCard
          step={3} icon={HardDrive}
          title={t("step3.title")}
          description={t("step3.desc")}
          status={googleConnected ? "connected" : "pending"} delay={0.3}
        >
          {googleConnected ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{t("step3.connected")}</span>
            </div>
          ) : (
            <Button
              onClick={handleGoogleConnect}
              className="w-full sm:w-auto h-10 px-6 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium rounded-xl text-sm"
            >
              <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("step3.btn")}
              <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-60" />
            </Button>
          )}
        </ActionCard>

        {/* 4. Stripe Top-up */}
        <ActionCard
          step={4} icon={CreditCard}
          title={t("step4.title")}
          description={t("step4.desc")}
          status={userCredits > 0 ? "connected" : "ready"} delay={0.4}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-sm text-white/40">{t("step4.balance")}</span>
              <span className="text-lg font-bold text-[hsl(16,70%,56%)]">{userCredits} pts</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-lg font-bold text-white">$1</div>
                <div className="text-[11px] text-white/30">{t("step4.usd")}</div>
              </div>
              <div className="px-3 py-2.5 rounded-xl border border-[hsl(16,70%,56%)]/20 bg-[hsl(16,70%,56%)]/5">
                <div className="text-lg font-bold text-[hsl(16,70%,56%)]">30 pts</div>
                <div className="text-[11px] text-white/40">{t("step4.pts")}</div>
              </div>
            </div>

            <Button
              onClick={handleStripeTopup}
              className="w-full h-11 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[hsl(16,70%,56%)]/20"
            >
              <CreditCard className="mr-2 w-4 h-4" />
              {t("step4.btn")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </ActionCard>

      </div>
    </div>
  );
}

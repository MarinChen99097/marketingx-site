"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Bot, Facebook, HardDrive, CreditCard,
  ArrowRight, CheckCircle, ExternalLink,
  Copy, Check, Sparkles, LogOut, Loader2, KeyRound,
  Globe, Terminal, Code2
} from "lucide-react";
import { LandingAILogo } from "@/components/LandingAILogo";
import { Button } from "@/components/ui/button";
import api, { zereoApi } from "@/lib/api";
import { detectCountry, isTaiwan } from "@/lib/geo";

// lucide-react has no TikTok icon — inline an ElementType-compatible SVG
// so it can be passed as `icon={TikTokIcon}` to ActionCard.
function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * COMMAND SNIPPET — terminal-styled box with built-in copy button.
 * Used by STEP 1's per-platform install instructions, where each platform
 * needs 1–2 separately-copyable code blocks (MCP URL, install command,
 * activation prompt). Tracking which snippet was just copied lives in the
 * parent so cross-snippet "Copied!" feedback stays single-shot.
 * ═══════════════════════════════════════════════════════════════════ */
function CommandSnippet({ label, text, snippetKey, copiedKey, onCopy }: {
  label: string; text: string; snippetKey: string;
  copiedKey: string | null; onCopy: (text: string, key: string) => void;
}) {
  const t = useTranslations("GetStarted");
  const isCopied = copiedKey === snippetKey;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4 relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57] shrink-0" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e] shrink-0" />
          <div className="w-2 h-2 rounded-full bg-[#28c840] shrink-0" />
          <span className="text-[10px] text-white/30 font-mono truncate">{label}</span>
        </div>
        <button
          onClick={() => onCopy(text, snippetKey)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-white/50 hover:text-white border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all shrink-0"
        >
          {isCopied ? (
            <><Check className="w-3 h-3 text-green-400" /> {t("step1.copiedBtn")}</>
          ) : (
            <><Copy className="w-3 h-3" /> {t("step1.copyBtn")}</>
          )}
        </button>
      </div>
      <div className="font-mono text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-wrap break-all">
        {text}
      </div>
    </div>
  );
}

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
  const [prevCredits, setPrevCredits] = useState<number | null>(null);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const [topupAmount, setTopupAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState(false);
  // Detected visitor country (ISO 3166-1 alpha-2). Null until geo lookup finishes
  // or if all providers fail. TW → twGateway choice; everything else → Stripe.
  const [country, setCountry] = useState<string | null>(null);
  // Admin-configured Taiwan-IP gateway override. `null` = not yet fetched (treat
  // as the historical default "payuni" until it loads). Read from
  // /pricing/tw-gateway, written via the admin console.
  const [twGateway, setTwGateway] = useState<"payuni" | "stripe" | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Token (STEP 2) state
  const [aiToken, setAiToken] = useState<string | null>(null);
  const [aiTokenExpiresAt, setAiTokenExpiresAt] = useState<string | null>(null);
  const [aiTokenCopied, setAiTokenCopied] = useState(false);
  const [aiTokenLoading, setAiTokenLoading] = useState(false);
  const [aiTokenError, setAiTokenError] = useState<string | null>(null);
  const [showFallbackInput, setShowFallbackInput] = useState(false);

  // ── Auto Top-up state (STEP 6 toggle) ──
  // Mirrors the backend `GET /pricing/auto-topup` response. `null` means we
  // haven't loaded status yet; we render the toggle as disabled until it arrives.
  type AutoTopupStatus = {
    enabled: boolean;
    has_payment_method: boolean;
    gateway: string | null;
    threshold_pts: number;
    topup_amount_usd: number;
    consecutive_failures: number;
    sca_attempts: number;
    last_attempted_at: string | null;
    next_attempt_after: string | null;
    last_failure_reason: string | null;
    payuni_card_memo_enabled: boolean;
  };
  const [autoTopupStatus, setAutoTopupStatus] = useState<AutoTopupStatus | null>(null);
  // Single state machine: 'idle' (default) | 'busy' (in-flight enable/disable API)
  // | 'polling' (Checkout return waiting for webhook) | 'polling-timeout' (gave up).
  // Encodes 4 valid states instead of 3 booleans encoding 8 (only 4 of which were valid).
  type AutoTopupUiState = "idle" | "busy" | "polling" | "polling-timeout";
  const [autoTopupUi, setAutoTopupUi] = useState<AutoTopupUiState>("idle");

  const [autoTopupDisableModalOpen, setAutoTopupDisableModalOpen] = useState(false);
  const [autoTopupConfirmInput, setAutoTopupConfirmInput] = useState("");
  const [autoTopupFirstTopupModalOpen, setAutoTopupFirstTopupModalOpen] = useState(false);

  // Mirror the backend's normalization exactly: NFKC (so fullwidth ＤＥＬＥＴＥ
  // from CJK IMEs is accepted), then strip whitespace, then uppercase. Without
  // NFKC the client would reject inputs the backend would accept — UX bug.
  const isDeleteConfirmed =
    autoTopupConfirmInput.normalize("NFKC").replace(/\s+/g, "").toUpperCase() === "DELETE";

  const autoTopupToggleDisabled =
    autoTopupStatus === null ||
    autoTopupUi !== "idle" ||
    (autoTopupStatus.gateway === "payuni" && !autoTopupStatus.payuni_card_memo_enabled);

  // Drive expirySoon with a single setTimeout scheduled to fire at the
  // "entering last 30 min" boundary — not a minute-ticking setInterval.
  // This avoids re-rendering the page every 60 s for 11+ hours when
  // the token is nowhere near expiry.
  const [expirySoon, setExpirySoon] = useState(false);
  useEffect(() => {
    if (!aiTokenExpiresAt) { setExpirySoon(false); return; }
    const expiresMs = new Date(aiTokenExpiresAt).getTime();
    const warnAtMs = expiresMs - 30 * 60 * 1000;
    const now = Date.now();
    if (now >= warnAtMs) { setExpirySoon(true); return; }
    setExpirySoon(false);
    const id = setTimeout(() => setExpirySoon(true), warnAtMs - now);
    return () => clearTimeout(id);
  }, [aiTokenExpiresAt]);

  // Generating a new AI Token REVOKES any previously issued one (backend
  // bumps ai_token_version). Only call this as a deliberate user action —
  // never on page mount — or we'd silently invalidate tokens the user
  // already pasted into other AI assistants. Current session's plaintext
  // is kept in sessionStorage so a same-tab refresh doesn't lose the view
  // (sessionStorage clears on tab close, which is the right TTL for an
  // ephemeral bearer-precursor value).
  const AI_TOKEN_SS_KEY = "mx_ai_token";
  const AI_TOKEN_EXPIRES_SS_KEY = "mx_ai_token_expires";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(AI_TOKEN_SS_KEY);
    const cachedExp = sessionStorage.getItem(AI_TOKEN_EXPIRES_SS_KEY);
    if (cached && cachedExp && new Date(cachedExp).getTime() > Date.now()) {
      setAiToken(cached);
      setAiTokenExpiresAt(cachedExp);
    }
  }, []);

  const fetchAiToken = async () => {
    setAiTokenLoading(true);
    setAiTokenError(null);
    setShowFallbackInput(false);
    setAiTokenCopied(false);
    try {
      const res = await api.post("/auth/ai-token/create");
      setAiToken(res.data.ai_token);
      setAiTokenExpiresAt(res.data.expires_at);
      sessionStorage.setItem(AI_TOKEN_SS_KEY, res.data.ai_token);
      sessionStorage.setItem(AI_TOKEN_EXPIRES_SS_KEY, res.data.expires_at);
    } catch (err: unknown) {
      console.error("[GetStarted] AI token create failed:", err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setAiTokenError(t("step2.featureUnavailable"));
      } else {
        setAiTokenError(t("step2.createFailed"));
      }
    } finally {
      setAiTokenLoading(false);
    }
  };

  const handleAiTokenCopy = async () => {
    if (!aiToken) return;
    try {
      await navigator.clipboard.writeText(aiToken);
      setAiTokenCopied(true);
      setTimeout(() => setAiTokenCopied(false), 2500);
    } catch (err) {
      console.warn("[GetStarted] clipboard.writeText failed:", err);
      // iOS Safari / private mode — show a readonly input for manual selection
      setShowFallbackInput(true);
    }
  };

  const LANDING_AI_URL = "https://salecraft.ai";
  // Pin to the latest Salecraft-Plugin commit SHA (injected at build time) so
  // Claude's web_fetch cache can't serve stale CLAUDE.md. Fail-soft to 'master'.
  const PLUGIN_SHA = process.env.NEXT_PUBLIC_PLUGIN_SHA || "master";
  const PLUGIN_URL = `https://raw.githubusercontent.com/connactai/Salecraft-Plugin/${PLUGIN_SHA}/CLAUDE.md`;
  const PLUGIN_CMD = `${t("step1.command")}\n${PLUGIN_URL}`;

  // ── STEP 1: MCP install endpoints ──
  // Service_system exposes a remote MCP SSE endpoint with 437+ tools (LP gen,
  // social publish, deep research). Connector itself is unauthenticated; tool
  // calls require the AI Login Token from STEP 2 (passed as `user_token`).
  // Override via NEXT_PUBLIC_MCP_SSE_URL once we map a friendly domain
  // (e.g. mcp.salecraft.ai).
  const MCP_SSE_URL =
    process.env.NEXT_PUBLIC_MCP_SSE_URL ||
    "https://service-system-s6ykq3ylca-de.a.run.app/mcp/sse";
  const CLAUDE_CODE_INSTALL_CMD = `claude mcp add --transport sse salecraft ${MCP_SSE_URL}`;
  const OPENCLAW_INSTALL_CMD = `openclaw mcp add salecraft --url ${MCP_SSE_URL}`;

  // ── STEP 1: Platform tab + per-snippet copy state ──
  type PlatformKey = "claudeWeb" | "claudeCode" | "openClaw" | "other";
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("claudeWeb");
  // Single string identifies which copy button was just clicked, so we can show
  // a per-button "Copied!" feedback without lifting copied-flag state per snippet.
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const handleCopySnippet = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // iOS Safari / private mode fallback — same pattern as handleCopy below.
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

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
      // Clean URL immediately to prevent retry loops on refresh
      window.history.replaceState(null, "", `/${locale}/get-started`);

      const redirectUri = `${window.location.origin}/${locale}/get-started`;
      if (oauthScope.includes("drive") || oauthScope.includes("googleapis")) {
        // Google Drive OAuth callback
        api.post("/ai-agent/gdrive/auth-callback", {
          code: oauthCode,
          redirect_uri: redirectUri,
        }).then(() => {
          setGoogleConnected(true);
          setLoading(false);
        }).catch((err) => {
          console.error("[GetStarted] Google Drive callback failed:", err);
          setLoading(false);
        });
      } else {
        // Meta OAuth callback
        zereoApi.post("/social/accounts/meta/callback", {
          code: oauthCode,
          redirect_uri: redirectUri,
          state: oauthState || "",
        }).then(() => {
          setMetaConnected(true);
          setLoading(false);
        }).catch((err) => {
          console.error("[GetStarted] Meta callback failed:", err);
          setLoading(false);
        });
      }
      // Don't skip — still need to fetch profile for credits/email
    }

    // ── 2b. Handle TikTok OAuth backend redirect (?tiktok=connected|error) ──
    // (TikTok OAuth is server-side: backend exchanges the code then redirects
    // back here with a result flag — the FE never sees ?code=... for TikTok.)
    const tiktokResult = params.get("tiktok");
    if (tiktokResult === "connected") {
      setTiktokConnected(true);
      window.history.replaceState(null, "", `/${locale}/get-started`);
    } else if (tiktokResult === "error") {
      const msg = params.get("msg") || "";
      console.error("[GetStarted] TikTok OAuth error:", msg);
      window.history.replaceState(null, "", `/${locale}/get-started`);
    }

    // ── 3. Handle Stripe success (?topup=success) ──
    if (params.get("topup") === "success") {
      // Save previous credits from localStorage (set before redirect)
      const savedPrev = localStorage.getItem("mx_prev_credits");
      if (savedPrev) setPrevCredits(parseInt(savedPrev, 10));
      setTopupSuccess(true);
      window.history.replaceState(null, "", `/${locale}/get-started`);
    }

    // ── 4. No token → redirect to salecraft.ai's own /auth page ──
    // Auth surface now lives on-site (Google OAuth only). Landing AI remains
    // the identity provider underneath — we just own the login UI now.
    const token = localStorage.getItem("token");
    if (!token) {
      const returnPath = `/${locale}/get-started`;
      window.location.href = `/${locale}/auth?returnUrl=${encodeURIComponent(returnPath)}`;
      return;
    }
    setIsLoggedIn(true);

    // ── 5. Fetch profile + check connections ──
    const fetchProfile = async () => {
      try {
        const res = await api.get("/settings/profile");
        setUserEmail(res.data.email || "");
        setUserCredits(res.data.credits || 0);
        // google_id only means Google login, NOT Drive access — don't set connected
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
        if (res.data?.connected || res.data?.accounts?.length > 0) {
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
        if (Array.isArray(accounts) && accounts.some((a: any) => a.platform === "tiktok")) {
          setTiktokConnected(true);
        }
      } catch { /* endpoint may not exist yet */ }
    };

    fetchProfile();
    checkMeta();
    checkGDrive();
    // fetchAiToken() is intentionally NOT called here — it would revoke
    // any previously-issued AI token on every page visit. The user
    // triggers it explicitly via the STEP 2 "Generate Token" button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

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

  const handleTiktokConnect = async () => {
    try {
      const finalRedirect = `${window.location.origin}/${locale}/get-started`;
      const res = await zereoApi.get("/social/accounts/tiktok/auth-url", {
        params: { final_redirect: finalRedirect },
      });
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
        return;
      }
    } catch (err) {
      console.error("[GetStarted] TikTok auth error:", err);
    }
    alert("TikTok 連結暫時無法使用，請稍後再試");
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

  // Fire-and-forget country detection on mount — result is cached in
  // sessionStorage by detectCountry(), so subsequent calls are free.
  useEffect(() => {
    let cancelled = false;
    detectCountry().then((cc) => { if (!cancelled) setCountry(cc); });
    return () => { cancelled = true; };
  }, []);

  // Fetch admin-configured TW gateway override. Endpoint is public/no-auth.
  // Failure leaves twGateway null → handleTopup falls back to "payuni" so the
  // historical TW behaviour is preserved when the backend is unreachable.
  useEffect(() => {
    let cancelled = false;
    api.get("/pricing/tw-gateway")
      .then((res) => {
        const v = res.data?.tw_default;
        if (!cancelled && (v === "payuni" || v === "stripe")) setTwGateway(v);
      })
      .catch(() => { /* silent: keep null, handleTopup falls back */ });
    return () => { cancelled = true; };
  }, []);

  // ── Auto Top-up: fetch status on mount (only when logged in) ──
  // Polling fires this 5+ times during Checkout return; if the response is
  // unchanged (typical until webhook commits), skip setState to avoid wasted re-renders.
  const fetchAutoTopupStatus = async (): Promise<AutoTopupStatus | null> => {
    try {
      const res = await api.get("/pricing/auto-topup");
      const data = res.data as AutoTopupStatus;
      setAutoTopupStatus((prev) =>
        prev && JSON.stringify(prev) === JSON.stringify(data) ? prev : data,
      );
      return data;
    } catch (err) {
      console.warn("[GetStarted] auto-topup status fetch failed:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAutoTopupStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Auto Top-up: shared polling state ──
  // The polling is driven from two places: the Checkout-return useEffect and
  // the Retry button. Both share this token so a new poll cancels any prior
  // one, and unmount cancels whatever is in-flight. Without this, double-clicks
  // would leak setTimeout chains and race the autoTopupUi state writes.
  const autoTopupPollTokenRef = useRef<{ cancelled: boolean } | null>(null);

  const startAutoTopupPolling = () => {
    // Cancel any prior poll. The previous loop will see `cancelled=true` on its
    // next tick and exit before flipping state.
    if (autoTopupPollTokenRef.current) {
      autoTopupPollTokenRef.current.cancelled = true;
    }
    const token = { cancelled: false };
    autoTopupPollTokenRef.current = token;

    setAutoTopupUi("polling");

    const delays = [1000, 2000, 4000, 8000, 8000]; // ≈ 23s total
    (async () => {
      for (const delay of delays) {
        if (token.cancelled) return;
        await new Promise((r) => setTimeout(r, delay));
        if (token.cancelled) return;
        const data = await fetchAutoTopupStatus();
        if (token.cancelled) return;
        if (data?.enabled) {
          setAutoTopupUi("idle");
          return;
        }
      }
      if (token.cancelled) return;
      setAutoTopupUi("polling-timeout");
    })();
  };

  // ── Auto Top-up: Checkout return → exponential-backoff polling ──
  // After a Stripe Checkout that opted into auto top-up, the FE returns with
  // `?auto_topup=pending` and the webhook hasn't necessarily fired yet. Poll
  // GET /pricing/auto-topup until enabled=true (or we give up around 23s).
  useEffect(() => {
    if (typeof window === "undefined" || !isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto_topup") !== "pending") return;

    // Strip the query param so a refresh doesn't restart polling.
    window.history.replaceState(null, "", `/${locale}/get-started`);
    startAutoTopupPolling();
    // Cleanup: on unmount or isLoggedIn flip, cancel the in-flight poll AND
    // reset the UI state. Without the reset, the poll loop bails on
    // `token.cancelled` without flipping state, leaving the toggle stuck on
    // "polling" if the effect ever re-runs.
    return () => {
      if (autoTopupPollTokenRef.current) {
        autoTopupPollTokenRef.current.cancelled = true;
      }
      setAutoTopupUi((prev) => (prev === "polling" ? "idle" : prev));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Belt-and-suspenders unmount cleanup. The `[isLoggedIn]` effect above only
  // runs (and registers cleanup) when the URL has `?auto_topup=pending`. The
  // Retry button can also start a poll outside of that effect, so we need a
  // standalone unmount cleanup to catch that path.
  useEffect(() => {
    return () => {
      if (autoTopupPollTokenRef.current) {
        autoTopupPollTokenRef.current.cancelled = true;
      }
    };
  }, []);

  // User-triggered re-poll after polling timed out. Reuses startAutoTopupPolling
  // which cancels any prior in-flight poll before starting a new one — so
  // rapid double-clicks coalesce to a single live poll.
  const handleAutoTopupRetryPolling = () => {
    startAutoTopupPolling();
  };

  /**
   * PayUni uses a POST auto-submit form (not a URL redirect). Build a hidden
   * form with the server-returned action_url + encrypted form_data, append it
   * to <body>, then submit() — this triggers a full-page POST to PayUni's
   * hosted payment page.
   */
  const submitPayUniForm = (actionUrl: string, formData: Record<string, string>) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = actionUrl;
    form.style.display = "none";
    for (const [name, value] of Object.entries(formData)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const handleTopup = async (opts?: { enableAutoTopup?: boolean }) => {
    // Save current credits before redirect so we can show diff on return
    localStorage.setItem("mx_prev_credits", String(userCredits));

    const enableAutoTopup = !!opts?.enableAutoTopup;

    // Geo hadn't resolved yet? Wait briefly so TW users don't get sent to Stripe.
    let cc = country;
    if (!cc) cc = await detectCountry();

    // Two distinct success URLs:
    //   - Manual top-up:    ?topup=success   (existing diff-modal flow)
    //   - Auto-topup enrol: ?auto_topup=pending (triggers polling effect above)
    const successUrl = enableAutoTopup
      ? `${window.location.origin}/${locale}/get-started?auto_topup=pending`
      : `${window.location.origin}/${locale}/get-started?topup=success`;
    const cancelUrl = `${window.location.origin}/${locale}/get-started`;

    // Route TW IPs by the admin-controlled toggle (default: payuni for
    // historical parity if /tw-gateway isn't loaded yet). Non-TW always Stripe.
    const useTwPayUni = isTaiwan(cc) && twGateway !== "stripe";
    if (useTwPayUni) {
      try {
        const res = await api.post("/pricing/payuni/checkout", {
          amount_usd: topupAmount,
          success_url: successUrl,
          cancel_url: cancelUrl,
          // PayUni auto-topup not yet supported (feature-flag locked backend-side).
          // Frontend still passes the flag for forward-compatibility, but backend
          // ignores it until payuni_card_memo_enabled flips on.
          enable_auto_topup: enableAutoTopup,
        });
        const { action_url, form_data } = res.data || {};
        if (action_url && form_data) {
          submitPayUniForm(action_url, form_data);
          return;
        }
        alert(locale === "en" ? "Unable to start checkout — please try again." : "無法啟動付款流程，請稍後再試。");
      } catch (err) {
        console.error("[GetStarted] PayUni error:", err);
        alert(locale === "en" ? "PayUni top-up is unavailable right now. Please try again later." : "PayUni 儲值暫時無法使用，請稍後再試。");
      }
      return;
    }

    // Stripe path: non-TW IP, or TW IP with admin toggle = stripe.
    try {
      const res = await api.post("/pricing/checkout", {
        amount_usd: topupAmount,
        success_url: successUrl,
        cancel_url: cancelUrl,
        enable_auto_topup: enableAutoTopup,
      });
      if (res.data?.checkout_url) { window.location.href = res.data.checkout_url; return; }
      alert(locale === "en" ? "Unable to start checkout — please try again." : "無法啟動付款流程，請稍後再試。");
    } catch (err) {
      console.error("[GetStarted] Stripe error:", err);
      alert(locale === "en" ? "Stripe top-up is unavailable right now. Please try again later." : "Stripe 儲值暫時無法使用，請稍後再試。");
    }
  };

  // ── Auto Top-up handlers ──
  // Toggle click router. ON → open DELETE-confirm modal. OFF + has PM → enable
  // via API. OFF + no PM → first-topup modal.
  const handleAutoTopupToggleClick = async () => {
    if (!autoTopupStatus || autoTopupUi !== "idle") return;
    if (autoTopupStatus.enabled) {
      setAutoTopupConfirmInput("");
      setAutoTopupDisableModalOpen(true);
      return;
    }
    if (!autoTopupStatus.has_payment_method) {
      setAutoTopupFirstTopupModalOpen(true);
      return;
    }
    setAutoTopupUi("busy");
    try {
      await api.post("/pricing/auto-topup/enable");
      await fetchAutoTopupStatus();
    } catch (err: unknown) {
      console.error("[GetStarted] auto-topup enable failed:", err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (detail === "no_payment_method") {
        setAutoTopupFirstTopupModalOpen(true);
      } else {
        alert(locale === "en" ? "Failed to enable auto top-up." : "啟用自動儲值失敗，請稍後再試。");
      }
    } finally {
      setAutoTopupUi("idle");
    }
  };

  const handleAutoTopupConfirmDisable = async () => {
    if (!isDeleteConfirmed || autoTopupUi === "busy") return;
    setAutoTopupUi("busy");
    try {
      // Send what the user ACTUALLY typed — backend re-normalizes (NFKC + whitespace
      // strip + uppercase). Hard-coding "DELETE" here would defeat that check.
      await api.post("/pricing/auto-topup/disable", { confirmation: autoTopupConfirmInput });
      setAutoTopupDisableModalOpen(false);
      setAutoTopupConfirmInput("");
      await fetchAutoTopupStatus();
    } catch (err) {
      console.error("[GetStarted] auto-topup disable failed:", err);
      alert(locale === "en" ? "Failed to disable auto top-up." : "關閉自動儲值失敗，請稍後再試。");
    } finally {
      setAutoTopupUi("idle");
    }
  };

  const handleAutoTopupEnrolViaCheckout = () => {
    setAutoTopupFirstTopupModalOpen(false);
    handleTopup({ enableAutoTopup: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    // `switch=1` flags this as an explicit account swap. /auth uses it to
    // (a) skip the "already logged in → redirect" short-circuit if a stale
    // token comes back, (b) call GIS disableAutoSelect() so the GIS button
    // doesn't silently re-sign-in with the same account, (c) surface a
    // "Use a different Google account" escape hatch.
    const returnUrl = encodeURIComponent(`/${locale}/get-started`);
    window.location.href = `/${locale}/auth?returnUrl=${returnUrl}&switch=1`;
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
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[hsl(16,70%,56%)] to-[hsl(16,80%,45%)] rounded-lg flex items-center justify-center shadow-lg shadow-[hsl(16,70%,56%)]/20">
            <LandingAILogo size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">SaleCraft</span>
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
            className="text-white/40 hover:text-white hover:bg-white/[0.06] h-auto px-2.5 py-1.5 rounded-lg text-xs gap-1.5"
            title={t("status.switchAccount")}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("status.switchAccount")}</span>
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
              SaleCraft
            </span>
          </h1>
          <p className="text-white/40 text-sm md:text-base max-w-md mx-auto">
            {t("welcome.subtitle")}
          </p>
        </motion.div>
      </div>

      {/* ════════════ TOPUP SUCCESS MODAL ════════════ */}
      {topupSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm rounded-2xl border border-green-500/20 bg-[#111113] p-8 space-y-6 shadow-2xl"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">儲值成功！</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="py-3 rounded-xl bg-white/[0.03]">
                <div className="text-[11px] text-white/40 mb-1">原餘額</div>
                <div className="text-base font-bold text-white/60">{prevCredits ?? "—"}</div>
                <div className="text-[10px] text-white/30">pts</div>
              </div>
              <div className="py-3 rounded-xl bg-green-500/5">
                <div className="text-[11px] text-white/40 mb-1">新增</div>
                <div className="text-base font-bold text-green-400">
                  +{prevCredits !== null && userCredits > prevCredits ? userCredits - prevCredits : 600}
                </div>
                <div className="text-[10px] text-white/30">pts</div>
              </div>
              <div className="py-3 rounded-xl bg-[hsl(16,70%,56%)]/5">
                <div className="text-[11px] text-white/40 mb-1">最終餘額</div>
                <div className="text-base font-bold text-[hsl(16,70%,56%)]">{userCredits}</div>
                <div className="text-[10px] text-white/30">pts</div>
              </div>
            </div>
            <Button
              onClick={() => { setTopupSuccess(false); localStorage.removeItem("mx_prev_credits"); }}
              className="w-full h-11 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-semibold rounded-xl text-sm"
            >
              確認
            </Button>
          </motion.div>
        </div>
      )}

      {/* ════════════ AUTO TOP-UP DISABLE MODAL ════════════ */}
      {/* Triggered ON → OFF. User must type DELETE to confirm. */}
      {autoTopupDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#111113] p-6 space-y-5 shadow-2xl"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{t("step5.autoTopup.modalTitle")}</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {t("step5.autoTopup.modalDescription")}
              </p>
            </div>
            <input
              type="text"
              autoFocus
              value={autoTopupConfirmInput}
              onChange={(e) => setAutoTopupConfirmInput(e.target.value)}
              placeholder={t("step5.autoTopup.confirmInputPlaceholder")}
              className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] text-white text-center font-mono px-4 outline-none focus:border-red-500/50 transition-colors"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setAutoTopupDisableModalOpen(false);
                  setAutoTopupConfirmInput("");
                }}
                disabled={autoTopupUi === "busy"}
                className="flex-1 h-10 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 rounded-xl text-sm"
              >
                {t("step5.autoTopup.cancelButton")}
              </Button>
              <Button
                onClick={handleAutoTopupConfirmDisable}
                disabled={!isDeleteConfirmed || autoTopupUi === "busy"}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:text-white/40 text-white font-semibold rounded-xl text-sm"
              >
                {autoTopupUi === "busy" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("step5.autoTopup.confirmButton")}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ════════════ AUTO TOP-UP REQUIRE-FIRST-TOPUP MODAL ════════════ */}
      {/* Triggered OFF → ON when user has no saved PaymentMethod. */}
      {autoTopupFirstTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl border border-[hsl(16,70%,56%)]/30 bg-[#111113] p-6 space-y-5 shadow-2xl"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{t("step5.autoTopup.requireFirstTopupTitle")}</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {t("step5.autoTopup.requireFirstTopupDesc")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoTopupFirstTopupModalOpen(false)}
                className="flex-1 h-10 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 rounded-xl text-sm"
              >
                {t("step5.autoTopup.cancelButton")}
              </Button>
              <Button
                onClick={handleAutoTopupEnrolViaCheckout}
                className="flex-1 h-10 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-semibold rounded-xl text-sm"
              >
                {t("step5.autoTopup.requireFirstTopupCTA")}
                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ════════════ 4 ACTION CARDS ════════════ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 md:pb-24 space-y-4">

        {/* 1. MCP install — platform-tabbed (Claude.ai / Claude Code / OpenClaw / Other) */}
        <ActionCard
          step={1} icon={Bot}
          title={t("step1.title")}
          description={t("step1.desc")}
          status={copiedSnippet ? "connected" : "ready"} delay={0.1}
        >
          <div className="space-y-4">
            {/* Platform pill selector. Sales users likely on Claude.ai web; devs on
                Claude Code/OpenClaw — default to claudeWeb to optimize for the larger
                audience. Tabs are stateful (no deep links) since this is one card. */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "claudeWeb",  icon: Globe,    label: t("step1.platforms.claudeWeb") },
                { key: "claudeCode", icon: Terminal, label: t("step1.platforms.claudeCode") },
                { key: "openClaw",   icon: Code2,    label: t("step1.platforms.openClaw") },
                { key: "other",      icon: Sparkles, label: t("step1.platforms.other") },
              ] as { key: PlatformKey; icon: React.ElementType; label: string }[]).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePlatform(p.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activePlatform === p.key
                      ? "bg-[hsl(16,70%,56%)] text-white shadow-lg shadow-[hsl(16,70%,56%)]/20"
                      : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <p.icon className="w-3.5 h-3.5" />
                  {p.label}
                </button>
              ))}
            </div>

            {/* CLAUDE.AI WEB — Custom Connector flow.
                Step 3 (paste prompt) is the same across all platforms; the per-platform
                difference is the install step before it. */}
            {activePlatform === "claudeWeb" && (
              <div className="space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">①</span> {t("step1.claudeWeb.s1")}
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">②</span> {t("step1.claudeWeb.s2")}
                </p>
                <CommandSnippet
                  label={t("step1.labelMcpUrl")} text={MCP_SSE_URL}
                  snippetKey="claudeWeb_url" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">③</span> {t("step1.claudeWeb.s3")}
                </p>
                <CommandSnippet
                  label={t("step1.labelPrompt")} text={PLUGIN_CMD}
                  snippetKey="claudeWeb_prompt" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
                <p className="text-[11px] text-yellow-400/70 leading-relaxed">
                  ⚠️ {t("step1.claudeWeb.requirePro")}
                </p>
              </div>
            )}

            {/* CLAUDE CODE — single CLI command + activation prompt */}
            {activePlatform === "claudeCode" && (
              <div className="space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">①</span> {t("step1.claudeCode.s1")}
                </p>
                <CommandSnippet
                  label={t("step1.labelInstallCmd")} text={CLAUDE_CODE_INSTALL_CMD}
                  snippetKey="claudeCode_install" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">②</span> {t("step1.claudeCode.s2")}
                </p>
                <CommandSnippet
                  label={t("step1.labelPrompt")} text={PLUGIN_CMD}
                  snippetKey="claudeCode_prompt" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
              </div>
            )}

            {/* OPENCLAW — local daemon + chat channels (WhatsApp/Telegram/etc) */}
            {activePlatform === "openClaw" && (
              <div className="space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">①</span> {t("step1.openClaw.s1")}
                </p>
                <CommandSnippet
                  label={t("step1.labelInstallCmd")} text={OPENCLAW_INSTALL_CMD}
                  snippetKey="openClaw_install" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
                <p className="text-sm text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">②</span> {t("step1.openClaw.s2")}
                </p>
                <CommandSnippet
                  label={t("step1.labelPrompt")} text={PLUGIN_CMD}
                  snippetKey="openClaw_prompt" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
              </div>
            )}

            {/* OTHER — universal fallback. Pure prompt mode (no MCP tools). The
                ChatGPT hint upgrades Plus+ users to the Apps & Connectors flow with
                the same MCP URL — same tools, same auth, just a different UI. */}
            {activePlatform === "other" && (
              <div className="space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  {t("step1.other.intro")}
                </p>
                <CommandSnippet
                  label={t("step1.labelPrompt")} text={PLUGIN_CMD}
                  snippetKey="other_prompt" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                />
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                  <p className="text-[12px] text-blue-300 leading-relaxed">
                    {t("step1.other.chatgptHint")}
                  </p>
                  <CommandSnippet
                    label={t("step1.labelMcpUrl")} text={MCP_SSE_URL}
                    snippetKey="other_chatgptUrl" copiedKey={copiedSnippet} onCopy={handleCopySnippet}
                  />
                </div>
              </div>
            )}
          </div>
        </ActionCard>

        {/* 2. AI Login Token */}
        <ActionCard
          step={2} icon={KeyRound}
          title={t("step2.title")}
          description={t("step2.desc")}
          status={aiToken && !aiTokenError ? "connected" : "ready"} delay={0.2}
        >
          <div className="space-y-3">
            {aiTokenError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
                {aiTokenError}
              </div>
            ) : !aiToken && !aiTokenLoading ? (
              // No token yet — show a single explicit generate button so
              // merely visiting this page doesn't silently revoke an already-
              // issued token living in another AI chat.
              <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-5 space-y-3">
                <p className="text-sm text-white/60">{t("step2.generatePrompt")}</p>
                <Button
                  onClick={fetchAiToken}
                  className="h-10 px-6 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-medium rounded-xl text-sm shadow-lg shadow-[hsl(16,70%,56%)]/20"
                >
                  <KeyRound className="mr-2 w-4 h-4" />
                  {t("step2.generateBtn")}
                </Button>
              </div>
            ) : showFallbackInput ? (
              <>
                <p className="text-xs text-yellow-400">{t("step2.copyFailed")}</p>
                <input
                  readOnly
                  value={aiToken ?? ""}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  className="w-full font-mono text-xs sm:text-sm bg-[#111113] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80"
                />
              </>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4">
                <div className="font-mono text-xs sm:text-sm text-white/80 break-all">
                  {aiTokenLoading ? t("step2.loading") : aiToken}
                </div>
              </div>
            )}
            {aiToken && !aiTokenError && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={showFallbackInput ? undefined : handleAiTokenCopy}
                    disabled={!aiToken || aiTokenLoading || showFallbackInput}
                    className="h-10 px-6 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-medium rounded-xl text-sm shadow-lg shadow-[hsl(16,70%,56%)]/20 disabled:opacity-50"
                  >
                    {showFallbackInput
                      ? <>{t("step2.tapToSelect")}</>
                      : aiTokenCopied
                        ? <><Check className="mr-2 w-4 h-4" /> {t("step2.copiedBtn")}</>
                        : <><Copy className="mr-2 w-4 h-4" /> {t("step2.copyBtn")}</>
                    }
                  </Button>
                  <button
                    onClick={fetchAiToken}
                    disabled={aiTokenLoading}
                    className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-50 underline underline-offset-2"
                  >
                    {t("step2.regenerate")}
                  </button>
                  {aiTokenExpiresAt && (
                    <span className={`text-xs ${expirySoon ? "text-yellow-400" : "text-white/30"}`}>
                      {expirySoon
                        ? t("step2.expiresSoon")
                        : t("step2.expiresAt", {
                            time: new Date(aiTokenExpiresAt).toLocaleString(locale)
                          })
                      }
                    </span>
                  )}
                </div>
                <p className="text-xs text-yellow-400/70 leading-relaxed">
                  ⚠️ {t("step2.singleLiveWarning")}
                </p>
              </>
            )}
          </div>
        </ActionCard>

        {/* 3. Meta (FB/IG) */}
        <ActionCard
          step={3} icon={Facebook}
          title={t("step3.title")}
          description={t("step3.desc")}
          status={metaConnected ? "connected" : "ready"} delay={0.3}
        >
          {metaConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t("step3.connected")}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await zereoApi.get("/social/accounts/");
                    const accounts = (res.data || []) as Array<{ id: string; platform: string }>;
                    for (const a of accounts) {
                      if (a.platform === "meta" || a.platform === "facebook" || a.platform === "instagram") {
                        await zereoApi.delete(`/social/accounts/${a.id}`);
                      }
                    }
                  } catch (err) { console.error("[GetStarted] Meta disconnect:", err); }
                  setMetaConnected(false);
                }}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >解除綁定</button>
            </div>
          ) : (
            <Button
              onClick={handleMetaConnect}
              className="w-full sm:w-auto h-10 px-6 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-xl text-sm"
            >
              <Facebook className="mr-2 w-4 h-4" />
              {t("step3.btn")}
              <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-60" />
            </Button>
          )}
        </ActionCard>

        {/* 4. TikTok
            i18n key is `tiktok.*` (not `step4.*`) — existing step4/step5 keys
            stay mapped to Google/Stripe below to minimize translation churn. */}
        <ActionCard
          step={4} icon={TikTokIcon}
          title={t("tiktok.title")}
          description={t("tiktok.desc")}
          status={tiktokConnected ? "connected" : "pending"} delay={0.4}
        >
          {tiktokConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t("tiktok.connected")}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await zereoApi.get("/social/accounts/");
                    const accounts = (res.data || []) as Array<{ id: string; platform: string }>;
                    for (const a of accounts) {
                      if (a.platform === "tiktok") {
                        await zereoApi.delete(`/social/accounts/${a.id}`);
                      }
                    }
                  } catch (err) { console.error("[GetStarted] TikTok disconnect:", err); }
                  setTiktokConnected(false);
                }}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >解除綁定</button>
            </div>
          ) : (
            <Button
              onClick={handleTiktokConnect}
              className="w-full sm:w-auto h-10 px-6 bg-black hover:bg-neutral-900 border border-white/15 text-white font-medium rounded-xl text-sm"
            >
              <TikTokIcon className="mr-2 w-4 h-4" />
              {t("tiktok.btn")}
              <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-60" />
            </Button>
          )}
        </ActionCard>

        {/* 5. Google (legacy i18n key: step4) */}
        <ActionCard
          step={5} icon={HardDrive}
          title={t("step4.title")}
          description={t("step4.desc")}
          status={googleConnected ? "connected" : "pending"} delay={0.5}
        >
          {googleConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t("step4.connected")}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await api.get("/ai-agent/gdrive/status");
                    const accounts = res.data?.accounts || [];
                    for (const a of accounts) {
                      await api.delete(`/ai-agent/gdrive/${a.id}`);
                    }
                  } catch (err) { console.error("[GetStarted] GDrive disconnect:", err); }
                  setGoogleConnected(false);
                }}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >解除綁定</button>
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
              {t("step4.btn")}
              <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-60" />
            </Button>
          )}
        </ActionCard>

        {/* 6. Stripe Top-up (legacy i18n key: step5) */}
        <ActionCard
          step={6} icon={CreditCard}
          title={t("step5.title")}
          description={t("step5.desc")}
          status={userCredits > 0 ? "connected" : "ready"} delay={0.6}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-sm text-white/40">{t("step5.balance")}</span>
              <span className="text-lg font-bold text-[hsl(16,70%,56%)]">{userCredits} pts</span>
            </div>

            {/* Amount selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">{t("step5.amountLabel")}</span>
                <span className="text-xs text-white/30">$1 USD = 1 pt</span>
              </div>
              {/* 3 options: $20, $75, Custom */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setTopupAmount(20); setCustomAmount(false); }}
                  className={`py-3 rounded-xl text-center transition-all ${!customAmount && topupAmount === 20 ? "bg-[hsl(16,70%,56%)] text-white ring-2 ring-[hsl(16,70%,56%)]/30" : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"}`}
                >
                  <div className="text-lg font-bold">$20</div>
                  <div className="text-[10px] opacity-60">20 pts</div>
                </button>
                <button
                  onClick={() => { setTopupAmount(75); setCustomAmount(false); }}
                  className={`py-3 rounded-xl text-center transition-all ${!customAmount && topupAmount === 75 ? "bg-[hsl(16,70%,56%)] text-white ring-2 ring-[hsl(16,70%,56%)]/30" : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"}`}
                >
                  <div className="text-lg font-bold">$75</div>
                  <div className="text-[10px] opacity-60">75 pts</div>
                </button>
                <button
                  onClick={() => setCustomAmount(true)}
                  className={`py-3 rounded-xl text-center transition-all ${customAmount ? "bg-[hsl(16,70%,56%)] text-white ring-2 ring-[hsl(16,70%,56%)]/30" : "border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"}`}
                >
                  <div className="text-lg font-bold">{t("step5.custom")}</div>
                  <div className="text-[10px] opacity-60">min $20</div>
                </button>
              </div>
              {/* Custom amount input */}
              {customAmount && (
                <div className="flex items-center gap-3">
                  <span className="text-white/50 text-lg font-bold">$</span>
                  <input
                    type="number"
                    min={20}
                    step={1}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Math.max(20, parseInt(e.target.value) || 20))}
                    className="flex-1 h-11 rounded-xl border border-white/10 bg-white/[0.04] text-white text-center text-xl font-bold px-4 outline-none focus:border-[hsl(16,70%,56%)]/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-white/40 text-sm">= {topupAmount} pts</span>
                </div>
              )}
            </div>

            {/* Auto Top-up toggle row — sits next to the recharge button per spec. */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/80">{t("step5.autoTopup.toggleLabel")}</div>
                {/* Subtext only after status loads — hardcoded fallback would lie
                    if admin changed `threshold_pts` or `topup_amount_usd` in settings.json. */}
                {autoTopupStatus && (
                  <div className="text-[11px] text-white/40 mt-0.5">
                    {t("step5.autoTopup.toggleSubtext", {
                      threshold: autoTopupStatus.threshold_pts,
                      amount: autoTopupStatus.topup_amount_usd,
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!autoTopupStatus?.enabled}
                disabled={autoTopupToggleDisabled}
                onClick={handleAutoTopupToggleClick}
                title={
                  autoTopupStatus?.gateway === "payuni" && !autoTopupStatus?.payuni_card_memo_enabled
                    ? t("step5.autoTopup.payuniDisabled")
                    : t("step5.autoTopup.tooltip")
                }
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  autoTopupStatus?.enabled ? "bg-[hsl(16,70%,56%)]" : "bg-white/15"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoTopupStatus?.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Auto Top-up status hints — ordered: in-flight polling → polling
                timed out → disabled-by-SCA → disabled-by-failures → enabled-with-SCA-pending →
                enabled-with-recent-failure. */}
            {autoTopupStatus && autoTopupUi === "polling" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-[12px] text-white/60">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t("step5.autoTopup.pendingActivation")}</span>
              </div>
            )}
            {autoTopupStatus && autoTopupUi === "polling-timeout" && !autoTopupStatus.enabled && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-[12px] text-white/60">
                <span>{t("step5.autoTopup.pendingActivationRetry")}</span>
                <button
                  type="button"
                  onClick={handleAutoTopupRetryPolling}
                  className="shrink-0 px-2 py-1 rounded-md border border-white/10 hover:bg-white/[0.06] text-[11px] text-white/80"
                >
                  {t("step5.autoTopup.pendingActivationRetryButton")}
                </button>
              </div>
            )}
            {autoTopupStatus &&
              !autoTopupStatus.enabled &&
              autoTopupStatus.last_failure_reason === "authentication_required" && (
                <div className="px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-[12px] text-yellow-300">
                  {t("step5.autoTopup.scaDisabledNotice")}
                </div>
              )}
            {autoTopupStatus &&
              !autoTopupStatus.enabled &&
              autoTopupStatus.last_failure_reason &&
              autoTopupStatus.last_failure_reason !== "authentication_required" &&
              autoTopupStatus.consecutive_failures >= 3 && (
                <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[12px] text-red-300">
                  {t("step5.autoTopup.failureDisabledNotice", {
                    reason: autoTopupStatus.last_failure_reason,
                  })}
                </div>
              )}
            {autoTopupStatus &&
              autoTopupStatus.enabled &&
              autoTopupStatus.last_failure_reason === "authentication_required" && (
                <div className="px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-[12px] text-yellow-300">
                  {t("step5.autoTopup.scaPending")}
                </div>
              )}
            {autoTopupStatus &&
              autoTopupStatus.enabled &&
              autoTopupStatus.consecutive_failures > 0 &&
              autoTopupStatus.last_failure_reason &&
              autoTopupStatus.last_failure_reason !== "authentication_required" && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/20 text-[12px] text-orange-300">
                  <span className="min-w-0 truncate">
                    {t("step5.autoTopup.failureNotice", {
                      reason: autoTopupStatus.last_failure_reason,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTopup({ enableAutoTopup: true })}
                    className="shrink-0 underline underline-offset-2 hover:text-orange-200"
                  >
                    {t("step5.autoTopup.updateCardLink")}
                  </button>
                </div>
              )}

            <Button
              onClick={() => handleTopup()}
              className="w-full h-11 bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[hsl(16,70%,56%)]/20"
            >
              <CreditCard className="mr-2 w-4 h-4" />
              {t("step5.btn")}
              {isTaiwan(country) && (
                <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">
                  {twGateway === "stripe" ? "Stripe" : "PayUni"}
                </span>
              )}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </ActionCard>

      </div>
    </div>
  );
}

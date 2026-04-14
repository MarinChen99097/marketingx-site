"use client";

import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, BarChart3,
  Globe, ShieldCheck, Layers, Bot,
  Megaphone, Video, FileText, Users,
  Building2, Utensils, GraduationCap,
  Landmark, Plane, Factory, ShoppingCart,
  Heart, ChevronDown, Copy, Check,
  ArrowDown, Star, Play, CreditCard,
  TrendingUp, Eye, MousePointer2, Search
} from "lucide-react";
import { LandingAILogo } from "@/components/LandingAILogo";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * STAR FIELD — Canvas-based animated starfield background
 * ═══════════════════════════════════════════════════════════════════ */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; r: number; speed: number; opacity: number; pulse: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create stars
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.8 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.pulse += 0.02;
        const o = star.opacity * (0.5 + 0.5 * Math.sin(star.pulse));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${o})`;
        ctx.fill();
        star.y -= star.speed;
        if (star.y < -5) {
          star.y = canvas.height + 5;
          star.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

/* ═══════════════════════════════════════════════════════════════════
 * TYPEWRITER — Cycling text with typing animation
 * ═══════════════════════════════════════════════════════════════════ */
function Typewriter({ words, className = "" }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length === word.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        }
      }
    }, isDeleting ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, words]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[3px] h-[1em] bg-current ml-1 animate-pulse" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * COUNT UP — Animated number
 * ═══════════════════════════════════════════════════════════════════ */
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const steps = 50;
    const inc = value / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(cur));
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
 * GLOW CARD — Zeabur-style dark card with gradient border on hover
 * ═══════════════════════════════════════════════════════════════════ */
function GlowCard({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay }}
      className={`group relative rounded-2xl overflow-hidden ${className}`}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(16,70%,56%)]/20 via-transparent to-[hsl(16,70%,56%)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-[1px] rounded-2xl bg-[#111113] dark:bg-[#111113]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * INDUSTRY CARD
 * ═══════════════════════════════════════════════════════════════════ */
function IndustryCard({ icon: Icon, title, pain, solution, benefit, delay }: {
  icon: React.ElementType; title: string; pain: string; solution: string; benefit: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 space-y-4 hover:border-[hsl(16,70%,56%)]/30 hover:bg-white/[0.04] transition-all duration-400"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(16,70%,56%)]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[hsl(16,70%,56%)]" />
        </div>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/50 leading-relaxed">{pain}</p>
      <div className="pt-3 border-t border-white/[0.06]">
        <p className="text-sm font-medium text-[hsl(16,70%,56%)]">{solution}</p>
        <p className="text-xs text-white/40 mt-1.5">{benefit}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * DATA — moved inside component, see SaleCraftPage()
 * ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════ */
export default function SaleCraftPage() {
  const locale = useLocale();
  const t = useTranslations("SaleCraft");

  /* ── Data arrays (inside component to access t()) ── */
  const TYPEWRITER_WORDS = [
    t("typewriter.landingPage"),
    t("typewriter.reels"),
    t("typewriter.social"),
    t("typewriter.kol"),
    t("typewriter.brand"),
    t("typewriter.research"),
  ];

  const STATS = [
    { value: 30, suffix: " min", label: t("stats.speed"), icon: Zap },
    { value: 6, suffix: "", label: t("stats.platforms"), icon: Globe },
    { value: 8, suffix: "", label: t("stats.industries"), icon: Building2 },
    { value: 10, suffix: "+", label: t("stats.skills"), icon: Star },
  ];

  const HERO_FEATURES = [
    { icon: Factory, title: t("features.factory.title"), desc: t("features.factory.desc"), visual: "ai-pipeline" as const },
  ];

  const CAPABILITIES = [
    { icon: Bot, title: t("capabilities.items.pipeline.title"), desc: t("capabilities.items.pipeline.desc") },
    { icon: Video, title: t("capabilities.items.reels.title"), desc: t("capabilities.items.reels.desc") },
    { icon: Megaphone, title: t("capabilities.items.publish.title"), desc: t("capabilities.items.publish.desc") },
    { icon: Users, title: t("capabilities.items.kol.title"), desc: t("capabilities.items.kol.desc") },
    { icon: BarChart3, title: t("capabilities.items.monitor.title"), desc: t("capabilities.items.monitor.desc") },
    { icon: Globe, title: t("capabilities.items.i18n.title"), desc: t("capabilities.items.i18n.desc") },
    { icon: ShieldCheck, title: t("capabilities.items.compliance.title"), desc: t("capabilities.items.compliance.desc") },
    { icon: FileText, title: t("capabilities.items.research.title"), desc: t("capabilities.items.research.desc") },
    { icon: Search, title: t("capabilities.items.brand.title"), desc: t("capabilities.items.brand.desc") },
    { icon: Eye, title: t("capabilities.items.analytics.title"), desc: t("capabilities.items.analytics.desc") },
    { icon: MousePointer2, title: t("capabilities.items.docs.title"), desc: t("capabilities.items.docs.desc") },
    { icon: CreditCard, title: t("capabilities.items.stripe.title"), desc: t("capabilities.items.stripe.desc") },
  ];

  const INDUSTRIES = [
    { icon: ShoppingCart, title: t("industries.ecommerce.title"), pain: t("industries.ecommerce.pain"), solution: t("industries.ecommerce.solution"), benefit: t("industries.ecommerce.benefit") },
    { icon: Heart, title: t("industries.medical.title"), pain: t("industries.medical.pain"), solution: t("industries.medical.solution"), benefit: t("industries.medical.benefit") },
    { icon: Utensils, title: t("industries.food.title"), pain: t("industries.food.pain"), solution: t("industries.food.solution"), benefit: t("industries.food.benefit") },
    { icon: Building2, title: t("industries.fashion.title"), pain: t("industries.fashion.pain"), solution: t("industries.fashion.solution"), benefit: t("industries.fashion.benefit") },
    { icon: GraduationCap, title: t("industries.education.title"), pain: t("industries.education.pain"), solution: t("industries.education.solution"), benefit: t("industries.education.benefit") },
    { icon: Landmark, title: t("industries.finance.title"), pain: t("industries.finance.pain"), solution: t("industries.finance.solution"), benefit: t("industries.finance.benefit") },
    { icon: Plane, title: t("industries.travel.title"), pain: t("industries.travel.pain"), solution: t("industries.travel.solution"), benefit: t("industries.travel.benefit") },
    { icon: Factory, title: t("industries.manufacturing.title"), pain: t("industries.manufacturing.pain"), solution: t("industries.manufacturing.solution"), benefit: t("industries.manufacturing.benefit") },
  ];

  const STEPS = [
    { num: "01", title: t("howItWorks.steps.s1.title"), desc: t("howItWorks.steps.s1.desc") },
    { num: "02", title: t("howItWorks.steps.s2.title"), desc: t("howItWorks.steps.s2.desc") },
    { num: "03", title: t("howItWorks.steps.s3.title"), desc: t("howItWorks.steps.s3.desc") },
    { num: "04", title: t("howItWorks.steps.s4.title"), desc: t("howItWorks.steps.s4.desc") },
  ];

  const PIPELINE_STEPS = [
    t("features.ai.pipelineSteps.brandAnalysis"),
    t("features.ai.pipelineSteps.strategist"),
    t("features.ai.pipelineSteps.architect"),
    t("features.ai.pipelineSteps.factory"),
    t("features.ai.pipelineSteps.supervisor"),
    t("features.ai.pipelineSteps.goLive"),
  ];

  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Ensure page starts at top on load (mobile browsers sometimes restore scroll)
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const LANDING_AI_URL = "https://landingai.info";
  const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://marketingx-site-876464738390.asia-east1.run.app";
  const ctaHref = `${LANDING_AI_URL}/${locale}/register?returnUrl=${encodeURIComponent(`${SITE_URL}/${locale}/get-started`)}`;

  const PLUGIN_CMD = `Generate a landing page for me with this plugin\nhttps://github.com/MarinChen99097/marketingx.plugin`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(PLUGIN_CMD); } catch {
      const t = document.createElement("textarea"); t.value = PLUGIN_CMD;
      document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

      {/* ════════════ NAVBAR ════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-5 sm:px-8 py-4 flex justify-between items-center transition-all duration-300 ${scrolled ? "bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.06]" : ""}`}>
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[hsl(16,70%,56%)] to-[hsl(16,80%,45%)] rounded-lg flex items-center justify-center shadow-lg shadow-[hsl(16,70%,56%)]/20">
            <LandingAILogo size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">SaleCraft</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/50">
          <a href="#features" className="hover:text-white transition-colors duration-200">{t("nav.features")}</a>
          <a href="#industries" className="hover:text-white transition-colors duration-200">{t("nav.industries")}</a>
          <a href="#capabilities" className="hover:text-white transition-colors duration-200">{t("nav.capabilities")}</a>
        </div>

        <div className="flex gap-3 items-center">
          <a href={ctaHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-[hsl(16,70%,56%)] hover:bg-[hsl(16,70%,50%)] text-white font-medium rounded-lg h-9 px-5 text-sm shadow-lg shadow-[hsl(16,70%,56%)]/25">
              {t("nav.getStarted")}
            </Button>
          </a>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Star field */}
        <StarField />

        {/* Cosmic gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[hsl(16,70%,56%)]/15 via-[hsl(16,80%,40%)]/8 to-transparent rounded-full blur-[120px] -z-0" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-purple-600/10 via-transparent to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-to-tl from-[hsl(16,70%,56%)]/8 via-transparent to-transparent rounded-full blur-[80px]" />

        {/* Announcement badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 mb-8 mt-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(16,70%,56%)]/20 bg-[hsl(16,70%,56%)]/5 text-sm backdrop-blur-sm">
            <span className="px-2 py-0.5 rounded-full bg-[hsl(16,70%,56%)] text-white text-xs font-bold">{t("badgeNew")}</span>
            <span className="text-white/70">{t("badge")}</span>
            <ArrowRight className="w-4 h-4 text-white/40" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-4 max-w-5xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.05]">
            <span className="text-white">{t("hero.title1")}</span>
            <span className="bg-gradient-to-r from-[hsl(16,70%,60%)] via-[hsl(25,80%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">{t("hero.title2")}</span>
            <br className="hidden sm:block" />
            <Typewriter words={TYPEWRITER_WORDS} className="bg-gradient-to-r from-[hsl(16,70%,60%)] via-[hsl(25,80%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent" />
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-10 text-white/50 text-base md:text-lg max-w-2xl text-center mt-6 px-4 leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 z-10"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
            <ArrowDown className="w-5 h-5 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════ PLUGIN INSTALL (Claude 指令) ════════════ */}
      <section id="plugin-install" className="py-20 md:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(16,70%,56%)]/[0.03] to-transparent" />
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              {t("pluginInstall.title1")}<span className="bg-gradient-to-r from-[hsl(16,70%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">{t("pluginInstall.title2")}</span>
            </h2>
            <p className="text-white/50 text-sm md:text-base">{t("pluginInstall.subtitle")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(16,70%,56%)]/20 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#111113] p-6 md:p-8 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="text-xs text-white/30 ml-3 font-mono">Claude Code</span>
              </div>
              {/* Command */}
              <div className="font-mono text-sm md:text-base leading-relaxed">
                <span className="text-[hsl(16,70%,60%)]">&#10095;</span>{" "}
                <span className="text-white/80">Generate a landing page for me with this plugin</span>
                <br />
                <span className="text-[hsl(16,70%,60%)]">&#10095;</span>{" "}
                <span className="text-blue-400 break-all">https://github.com/MarinChen99097/marketingx.plugin</span>
              </div>
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-xs transition-all duration-200"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> {t("copied")}</> : <><Copy className="w-3.5 h-3.5" /> {t("copy")}</>}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section className="py-12 px-4 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <s.icon className="w-5 h-5 text-[hsl(16,70%,56%)]/60 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════ AI FACTORY (Hero Feature) ════════════ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <GlowCard delay={0.15}>
            <div className="p-8 sm:p-10 md:p-14 lg:p-16 space-y-6 md:space-y-8">
              {/* Icon + Title */}
              <div className="space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[hsl(16,70%,56%)]/10 flex items-center justify-center">
                  <Factory className="w-7 h-7 md:w-8 md:h-8 text-[hsl(16,70%,56%)]" />
                </div>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {t("features.factory.title")}
                </h3>
              </div>

              {/* Description — larger, better line breaks */}
              <p className="text-white/50 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-3xl">
                {t("features.factory.desc")}
              </p>

              {/* 3D Pipeline visual — isometric factory blocks */}
              <div className="pt-6 md:pt-10">
                <div className="flex flex-wrap justify-center gap-4 md:gap-6" style={{ perspective: "800px" }}>
                  {PIPELINE_STEPS.map((step, j) => {
                    const isLast = j === PIPELINE_STEPS.length - 1;
                    const accentColor = isLast ? "hsl(16,70%,56%)" : `hsl(${16 + j * 8},${50 + j * 5}%,${56 - j * 3}%)`;
                    return (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, y: 30, rotateX: 20 }}
                        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 + j * 0.12 }}
                        className="relative group"
                      >
                        {/* 3D Block */}
                        <div
                          className="relative w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
                          style={{ transformStyle: "preserve-3d", transform: "rotateX(10deg) rotateY(-15deg)" }}
                        >
                          {/* Top face */}
                          <div
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                              border: `1px solid ${accentColor}30`,
                              transform: "translateZ(20px)",
                              boxShadow: `0 0 30px ${accentColor}15`,
                            }}
                          />
                          {/* Front face */}
                          <div
                            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center"
                            style={{
                              background: `linear-gradient(180deg, ${accentColor}15, transparent)`,
                              border: `1px solid ${accentColor}20`,
                            }}
                          >
                            <div className="text-[10px] md:text-xs text-white/30 font-mono mb-1">0{j + 1}</div>
                            <div className={`text-xs sm:text-sm md:text-base font-bold ${isLast ? "text-[hsl(16,70%,56%)]" : "text-white/80"}`}>{step}</div>
                          </div>
                        </div>
                        {/* Connector arrow */}
                        {j < PIPELINE_STEPS.length - 1 && (
                          <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                            <ArrowRight className="w-4 h-4 text-[hsl(16,70%,56%)]/30" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
      </section>

      {/* ════════════ INDUSTRIES ════════════ */}
      <section id="industries" className="py-20 md:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {t("industries.sectionTitle1")}<span className="bg-gradient-to-r from-[hsl(16,70%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">{t("industries.sectionTitle2")}</span>{t("industries.sectionTitle3")}
            </h2>
            <p className="text-white/40 text-base md:text-lg max-w-xl mx-auto">
              {t("industries.sectionSubtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INDUSTRIES.map((ind, i) => (
              <IndustryCard key={i} {...ind} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CAPABILITIES GRID ════════════ */}
      <section id="capabilities" className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {t("capabilities.sectionTitle1")}<br className="sm:hidden" />
              <span className="bg-gradient-to-r from-[hsl(16,70%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">{t("capabilities.sectionTitle2")}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="text-center space-y-3 py-6"
              >
                <cap.icon className="w-6 h-6 text-[hsl(16,70%,56%)] mx-auto" />
                <h4 className="font-bold text-white text-sm">{cap.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed max-w-[200px] mx-auto">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(16,70%,56%)]/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {t("howItWorks.title")}
            </h2>
            <p className="text-white/40">{t("howItWorks.subtitle")}</p>
          </motion.div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-6 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300"
              >
                <span className="text-3xl font-black text-[hsl(16,70%,56%)]/20 shrink-0 w-12">{s.num}</span>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="py-24 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[hsl(16,70%,56%)]/10 rounded-full blur-[150px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center relative z-10 space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
            {t("finalCta.title1")}<br />
            <span className="bg-gradient-to-r from-[hsl(16,70%,60%)] via-[hsl(25,80%,60%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent">
              {t("finalCta.title2")}
            </span>
          </h2>
          <p className="text-white/45 text-base md:text-lg max-w-lg mx-auto">
            {t("finalCta.subtitle")}
          </p>
        </motion.div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="border-t border-white/[0.04] py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <LandingAILogo size={14} variant="minimal" className="text-white/30" />
            <span className="text-sm text-white/30">{t("footer.brand")}</span>
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href={`/${locale}/terms`} className="hover:text-white/60 transition-colors">{t("footer.terms")}</Link>
            <Link href={`/${locale}/privacy`} className="hover:text-white/60 transition-colors">{t("footer.privacy")}</Link>
            <a href="mailto:support@landingai.info" className="hover:text-white/60 transition-colors">{t("footer.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

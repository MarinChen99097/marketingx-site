"use client";

import { cn } from "@/lib/utils";

type LogoVariant = "default" | "bold" | "dual" | "circle" | "minimal";

interface LandingAILogoProps {
    /** Size of the icon in pixels (default: 20) */
    size?: number;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show the brand text alongside the icon */
    showText?: boolean;
    /** CSS classes for the text */
    textClassName?: string;
    /**
     * Logo variant:
     * - `default`  — Crisp filled LA, bold weight (header, nav, favicon)
     * - `bold`     — Filled LA with crossbar & counter detail (hero, large display)
     * - `dual`     — L in foreground + A in coral with crossbar (standalone branding)
     * - `circle`   — Dual-color inside concentric rings (badge, avatar)
     * - `minimal`  — Light-weight thin stroke (footer, subtle)
     */
    variant?: LogoVariant;
}

/* ═══════════════════════════════════════════════════════════════════
 * FILLED GEOMETRY — 32×32 viewBox
 *
 * Built from precise filled polygons instead of thick strokes.
 * Eliminates miter-join artefacts and renders crisply at any size.
 *
 * L shape: vertical bar (5 wide) + horizontal bar (5 tall)
 * A shape: two diagonal legs meeting at peak, with V-opening
 * Connection: L horizontal overlaps A's left base for seamless merge
 * ═══════════════════════════════════════════════════════════════════ */

// ── Bold: thick legs, no crossbar — optimised for 16–24 px ─────────
const L_BOLD = "M2 2 H7 V23 H14 V28 H2 Z";
const A_BOLD = "M12 28 L20.5 2 L29 28 H24 L20.5 9 L17 28 Z";

// ── Detailed: thinner legs + crossbar + counter — for ≥ 32 px ──────
const L_DETAIL  = "M3 2 H7.5 V23 H13.5 V28 H3 Z";
const A_DETAIL  = "M12 28 L20.5 2 L29 28 H25.5 L23 20 H18 L15.5 28 Z M19 17 L20.5 13 L22 17 Z";

// ── Circle variant geometry — 48×48 viewBox ────────────────────────
const L_CIRCLE  = "M10 10 H14.5 V30 H20.5 V35 H10 Z";
const A_CIRCLE  = "M18.5 35 L27 10 L35.5 35 H31 L27 18 L23.5 35 Z";

// ── Stroke path for minimal variant ─────────────────────────────────
const LA_STROKE = "M5 3 V27 H14 L21 3 L28 27";

/**
 * Landing AI brand logo — **LA** monogram.
 *
 * Uses filled geometric shapes for pixel-perfect rendering.
 * The L's baseline bar merges into the A's left leg, forming
 * a unified architectural mark. Warm coral echoes Anthropic style.
 */
export function LandingAILogo({
    size = 20,
    className,
    showText = false,
    textClassName,
    variant = "default",
}: LandingAILogoProps) {
    const svg = (() => {
        switch (variant) {

            /* ── Detailed filled with crossbar + counter ──────── */
            case "bold":
                return (
                    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="SaleCraft" role="img">
                        <path d={L_DETAIL} fill="currentColor" />
                        <path fillRule="evenodd" d={A_DETAIL} fill="currentColor" />
                    </svg>
                );

            /* ── L = foreground, A = coral with crossbar ─────── */
            case "dual":
                return (
                    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="SaleCraft" role="img">
                        <path d={L_DETAIL} fill="currentColor" />
                        <path fillRule="evenodd" d={A_DETAIL} style={{ fill: "hsl(var(--primary))" }} />
                    </svg>
                );

            /* ── Dual-color inside concentric rings ──────────── */
            case "circle":
                return (
                    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="SaleCraft" role="img">
                        <circle cx="24" cy="24" r="22.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.2" />
                        <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.1" />
                        <path d={L_CIRCLE} fill="currentColor" />
                        <path d={A_CIRCLE} style={{ fill: "hsl(var(--primary))" }} />
                    </svg>
                );

            /* ── Thin stroke — organic & subtle ──────────────── */
            case "minimal":
                return (
                    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SaleCraft" role="img">
                        <path d={LA_STROKE} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <line x1="17" y1="17.5" x2="25" y2="17.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                );

            /* ── Default — crisp bold filled for small sizes ─── */
            case "default":
            default:
                return (
                    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="SaleCraft" role="img">
                        <path d={L_BOLD} fill="currentColor" />
                        <path d={A_BOLD} fill="currentColor" />
                    </svg>
                );
        }
    })();

    return (
        <span className={cn("inline-flex items-center gap-2 leading-[0]", className)}>
            {svg}
            {showText && (
                <span className={cn("font-bold tracking-tight", textClassName)}>
                    SaleCraft
                </span>
            )}
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════════════
 * Standalone SVG strings — for favicon, OG image, static files
 * ═══════════════════════════════════════════════════════════════════ */

/** Monochrome bold filled LA in coral — for favicon & OG. */
export const LANDING_AI_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M2 2 H7 V23 H14 V28 H2 Z" fill="#DD6A40"/>
  <path d="M12 28 L20.5 2 L29 28 H24 L20.5 9 L17 28 Z" fill="#DD6A40"/>
</svg>`;

/** Dual-color filled LA — L charcoal, A coral. */
export const LANDING_AI_LOGO_DUAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M3 2 H7.5 V23 H13.5 V28 H3 Z" fill="#333333"/>
  <path fill-rule="evenodd" d="M12 28 L20.5 2 L29 28 H25.5 L23 20 H18 L15.5 28 Z M19 17 L20.5 13 L22 17 Z" fill="#DD6A40"/>
</svg>`;

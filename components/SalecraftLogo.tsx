"use client";

import { cn } from "@/lib/utils";

interface SalecraftLogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

export function SalecraftLogo({
    size = 28,
    className,
    showText = true,
    textClassName,
}: SalecraftLogoProps) {
    return (
        <span className={cn("inline-flex items-center gap-2 leading-[0]", className)}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="salecraft"
                role="img"
            >
                <rect x="2" y="2" width="28" height="28" rx="7" fill="#E8746A" />
                <path
                    d="M10 10 H22 V13 H13 V15 H22 V22 H10 V19 H19 V17 H10 Z"
                    fill="white"
                />
            </svg>
            {showText && (
                <span className={cn("font-semibold tracking-tight text-lg", textClassName)}>
                    salecraft
                </span>
            )}
        </span>
    );
}

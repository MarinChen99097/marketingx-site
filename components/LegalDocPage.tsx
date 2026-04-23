import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { LandingAILogo } from "@/components/LandingAILogo";
import { MarkdownLite } from "@/components/MarkdownLite";

type Slug = "terms" | "privacy";

// We only have translated copies for en + zh-TW. Every other locale falls back
// to English — legal content usually ships in a limited set of authoritative
// languages anyway.
async function readLegalDoc(slug: Slug, locale: string): Promise<string | null> {
    const suffix = locale === "zh-TW" ? "-zh-TW" : "";
    const filePath = path.join(process.cwd(), "public", `${slug}${suffix}.md`);
    try {
        return await fs.readFile(filePath, "utf8");
    } catch {
        // Fall back to English if locale-specific file missing.
        if (suffix) {
            try {
                return await fs.readFile(
                    path.join(process.cwd(), "public", `${slug}.md`),
                    "utf8"
                );
            } catch {
                return null;
            }
        }
        return null;
    }
}

export async function LegalDocPage({
    slug,
    locale,
}: {
    slug: Slug;
    locale: string;
}) {
    const [content, t] = await Promise.all([
        readLegalDoc(slug, locale),
        getTranslations("Legal"),
    ]);

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <nav className="px-5 sm:px-8 py-4 flex justify-between items-center border-b border-white/[0.06]">
                <Link href={`/${locale}`} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-[hsl(16,70%,56%)] to-[hsl(16,80%,45%)] rounded-lg flex items-center justify-center">
                        <LandingAILogo size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">SaleCraft</span>
                </Link>
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("backToHome")}
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                {content === null ? (
                    <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                        {t("failedToLoad")}
                    </div>
                ) : (
                    <MarkdownLite source={content} />
                )}
            </main>
        </div>
    );
}

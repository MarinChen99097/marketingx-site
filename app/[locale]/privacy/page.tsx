"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    const locale = useLocale();
    const [content, setContent] = useState("");

    useEffect(() => {
        const suffix = locale === "zh-TW" ? "-zh-TW" : locale === "zh-CN" ? "-zh-TW" : "";
        fetch(`/salecraft-privacy${suffix}.md`)
            .then((r) => r.text())
            .then(setContent)
            .catch(() => setContent(""));
    }, [locale]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-3xl mx-auto px-4 py-12">
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {locale === "zh-TW" || locale === "zh-CN" ? "返回" : "Back"}
                </Link>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                    {content}
                </pre>
            </div>
        </div>
    );
}

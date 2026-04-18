import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh-TW', 'zh-CN', 'ko', 'ja', 'vi', 'fr', 'th', 'es', 'pt', 'ar', 'de', 'id', 'ms', 'hi'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
    locales,
    defaultLocale: 'en',
    localeDetection: true
});

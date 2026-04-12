import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh-TW', 'ko', 'ja', 'vi', 'fr', 'th', 'es', 'pt', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
    locales,
    defaultLocale: 'en',
    localeDetection: true
});

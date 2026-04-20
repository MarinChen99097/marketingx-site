import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/routing'

// Static sitemap for marketingx-site. Single-brand site hosted on salecraft.ai,
// so baseUrl is hard-coded (canonical host is also enforced in middleware.ts).
// Emits locale-aware URLs with hreflang alternates for every known route.

const BASE_URL = 'https://salecraft.ai'

type RouteConfig = {
    path: string
    priority: number
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

const ROUTES: readonly RouteConfig[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/get-started', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/marketingx', priority: 0.8, changeFrequency: 'monthly' },
]

function languagesFor(path: string): Record<string, string> {
    const map: Record<string, string> = Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
    )
    map['x-default'] = `${BASE_URL}/en${path}`
    return map
}

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()
    return ROUTES.flatMap((route) =>
        locales.map((locale) => ({
            url: `${BASE_URL}/${locale}${route.path}`,
            lastModified: now,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            alternates: { languages: languagesFor(route.path) },
        }))
    )
}

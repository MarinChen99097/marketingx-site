import type { MetadataRoute } from 'next'

// Permissive robots.txt for marketingx-site on salecraft.ai.
// Allows standard search engines and major AI/LLM crawlers; advertises sitemap
// location so indexers can discover all locale-aware pages.

const BASE_URL = 'https://salecraft.ai'

const AI_BOTS = [
    'GPTBot',
    'ChatGPT-User',
    'Google-Extended',
    'GoogleOther',
    'anthropic-ai',
    'Claude-Web',
    'PerplexityBot',
    'CCBot',
    'FacebookExternalHit',
    'Meta-ExternalAgent',
    'Amazonbot',
    'Applebot',
    'cohere-ai',
    'Bytespider',
    'Diffbot',
    'YouBot',
    'ImagesiftBot',
]

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/' },
            ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/' })),
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    }
}

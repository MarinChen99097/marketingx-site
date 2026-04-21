import { redirect } from 'next/navigation'

// Legacy route kept for backward compatibility with external links that
// already point at /{locale}/marketingx. Real content lives at /{locale}.
// Next.js redirect() issues 307 by default which preserves method & is
// treated by Google as a permanent indexing hint when combined with our
// canonical setup.

export default async function MarketingxLegacyRedirect({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    redirect(`/${locale}`)
}

import { LegalDocPage } from "@/components/LegalDocPage";

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    return <LegalDocPage slug="privacy" locale={locale} />;
}

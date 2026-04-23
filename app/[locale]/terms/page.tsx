import { LegalDocPage } from "@/components/LegalDocPage";

export default async function TermsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    return <LegalDocPage slug="terms" locale={locale} />;
}

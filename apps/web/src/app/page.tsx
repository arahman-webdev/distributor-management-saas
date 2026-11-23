import { getCurrentSession } from "@/lib/actions/auth-actions";
import { LanguageProvider } from "@/lib/i18n";
import LandingView from "@/components/landing/landing-view";

export default async function LandingPage() {
  const session = await getCurrentSession();
  const user = session?.user as any;

  return (
    <LanguageProvider>
      <LandingView user={user || null} />
    </LanguageProvider>
  );
}

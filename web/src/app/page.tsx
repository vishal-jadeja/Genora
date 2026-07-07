import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

const TITLE = "Genora — Write once. Publish everywhere.";
const DESCRIPTION =
  "One raw thought in — a platform-native post out for LinkedIn, X, Reddit, Medium & Substack. No copy-paste, no re-writing five times.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Genora",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Genora",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    category: "Free tier, BYOK",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}

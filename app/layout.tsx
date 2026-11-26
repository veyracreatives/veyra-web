import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const SITE_URL = "https://www.veyracreatives.com";
const TITLE = "Veyra Creatives & Digital Lab | Digital Marketing Agency in Navi Mumbai & Thane";
const DESCRIPTION =
  "Veyra is a creative and digital marketing agency in Navi Mumbai and Thane. Social media and Meta ads, website development, logo and branding, content creation and influencer marketing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Veyra Creatives & Digital Lab" },
  description: DESCRIPTION,
  applicationName: "Veyra Creatives & Digital Lab",
  keywords: [
    "digital marketing agency Navi Mumbai",
    "digital marketing agency Thane",
    "social media marketing agency",
    "Meta ads agency",
    "website development Navi Mumbai",
    "logo and branding agency",
    "content creation agency",
    "influencer marketing agency",
    "Veyra",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Veyra Creatives & Digital Lab",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Veyra Creatives & Digital Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@veyradigital",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0D12",
  colorScheme: "dark",
};

/* Tells Google who we are, where we work and how to reach us. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#business`,
  name: "Veyra Creatives & Digital Lab",
  alternateName: "Veyra Lab",
  url: SITE_URL,
  logo: `${SITE_URL}/veyra_logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description: DESCRIPTION,
  telephone: "+91-89282-46726",
  address: { "@type": "PostalAddress", addressLocality: "Navi Mumbai", addressRegion: "Maharashtra", addressCountry: "IN" },
  areaServed: [
    { "@type": "City", name: "Navi Mumbai" },
    { "@type": "City", name: "Thane" },
    { "@type": "City", name: "Mumbai" },
  ],
  founder: [
    { "@type": "Person", name: "Rutvi Karad" },
    { "@type": "Person", name: "Dibesh Dinesan" },
  ],
  knowsAbout: [
    "Social media marketing",
    "Meta ads",
    "Website development",
    "Logo and branding",
    "Content creation",
    "Influencer marketing",
    "SEO",
  ],
  sameAs: [
    "https://www.instagram.com/veyralab.in/",
    "https://www.linkedin.com/company/veyracreativesanddigitallab/",
    "https://x.com/veyradigital",
    "https://www.facebook.com/share/18QsEqE6NL/",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 Added data-scroll-behavior here
    <html lang="en-IN" data-scroll-behavior="smooth">
      {/* REMOVED: style={{ fontFamily: "var(--font-body)" }} — next/font handles this via CSS variable */}
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} bg-[#0B0D12] text-[#F5F3EE]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
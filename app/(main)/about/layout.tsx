import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet Veyra Creatives & Digital Lab, founded by Rutvi Karad and Dibesh Dinesan. A creative and digital marketing studio for brands in Navi Mumbai, Thane and beyond.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About Veyra Creatives & Digital Lab" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

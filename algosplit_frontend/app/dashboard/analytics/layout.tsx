import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your spending analytics and transaction history on AlgoSplit. Track your bills and payments over time.",
  openGraph: {
    title: "Analytics | AlgoSplit",
    description: "View your spending analytics and transaction history on AlgoSplit. Track your bills and payments over time.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Analytics | AlgoSplit",
    description: "View your spending analytics and transaction history on AlgoSplit. Track your bills and payments over time.",
    images: ["/seo_image.png"]
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

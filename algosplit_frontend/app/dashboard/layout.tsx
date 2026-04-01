import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your bills, track payments, and view analytics on AlgoSplit. Your decentralized bill splitting dashboard.",
  openGraph: {
    title: "Dashboard | AlgoSplit",
    description: "Manage your bills, track payments, and view analytics on AlgoSplit. Your decentralized bill splitting dashboard.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Dashboard | AlgoSplit",
    description: "Manage your bills, track payments, and view analytics on AlgoSplit. Your decentralized bill splitting dashboard.",
    images: ["/seo_image.png"]
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

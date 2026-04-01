import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bill Details",
  description: "View bill details, payment status, and member information on AlgoSplit.",
  openGraph: {
    title: "Bill Details | AlgoSplit",
    description: "View bill details, payment status, and member information on AlgoSplit.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Bill Details | AlgoSplit",
    description: "View bill details, payment status, and member information on AlgoSplit.",
    images: ["/seo_image.png"]
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function BillDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

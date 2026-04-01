import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Bill",
  description: "Create a new bill on AlgoSplit. Split expenses with friends using Algorand blockchain smart contracts.",
  openGraph: {
    title: "Create Bill | AlgoSplit",
    description: "Create a new bill on AlgoSplit. Split expenses with friends using Algorand blockchain smart contracts.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Create Bill | AlgoSplit",
    description: "Create a new bill on AlgoSplit. Split expenses with friends using Algorand blockchain smart contracts.",
    images: ["/seo_image.png"]
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function CreateBillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

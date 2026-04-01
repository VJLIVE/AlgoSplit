import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Manage your contacts on AlgoSplit. Save frequently used wallet addresses for quick bill splitting.",
  openGraph: {
    title: "Contacts | AlgoSplit",
    description: "Manage your contacts on AlgoSplit. Save frequently used wallet addresses for quick bill splitting.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Contacts | AlgoSplit",
    description: "Manage your contacts on AlgoSplit. Save frequently used wallet addresses for quick bill splitting.",
    images: ["/seo_image.png"]
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

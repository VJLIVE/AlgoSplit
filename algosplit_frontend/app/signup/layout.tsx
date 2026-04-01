import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your AlgoSplit account and start splitting bills on Algorand blockchain. Connect your Pera Wallet to get started.",
  openGraph: {
    title: "Sign Up | AlgoSplit",
    description: "Create your AlgoSplit account and start splitting bills on Algorand blockchain. Connect your Pera Wallet to get started.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Sign Up | AlgoSplit",
    description: "Create your AlgoSplit account and start splitting bills on Algorand blockchain. Connect your Pera Wallet to get started.",
    images: ["/seo_image.png"]
  }
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

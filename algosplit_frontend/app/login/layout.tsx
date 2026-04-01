import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to AlgoSplit with your Pera Wallet. Secure wallet-based authentication with no passwords required.",
  openGraph: {
    title: "Login | AlgoSplit",
    description: "Login to AlgoSplit with your Pera Wallet. Secure wallet-based authentication with no passwords required.",
    images: ["/seo_image.png"]
  },
  twitter: {
    title: "Login | AlgoSplit",
    description: "Login to AlgoSplit with your Pera Wallet. Secure wallet-based authentication with no passwords required.",
    images: ["/seo_image.png"]
  }
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

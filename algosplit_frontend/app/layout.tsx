import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://algosplit.app'),
  title: {
    default: "AlgoSplit - Split Bills on Algorand Blockchain",
    template: "%s | AlgoSplit"
  },
  description: "Decentralized bill splitting on Algorand blockchain with instant settlement. Split expenses transparently with ~4.5s settlement time and minimal fees.",
  keywords: ["Algorand", "blockchain", "bill splitting", "cryptocurrency", "DeFi", "smart contracts", "Pera Wallet", "expense sharing", "payment settlement"],
  authors: [{ name: "AlgoSplit Team" }],
  creator: "AlgoSplit",
  publisher: "AlgoSplit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://algosplit.app",
    siteName: "AlgoSplit",
    title: "AlgoSplit - Split Bills on Algorand Blockchain",
    description: "Decentralized bill splitting on Algorand blockchain with instant settlement. Split expenses transparently with ~4.5s settlement time and minimal fees.",
    images: [
      {
        url: "/seo_image.png",
        width: 1200,
        height: 630,
        alt: "AlgoSplit - Decentralized Bill Splitting on Algorand"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AlgoSplit - Split Bills on Algorand Blockchain",
    description: "Decentralized bill splitting on Algorand blockchain with instant settlement. Split expenses transparently with ~4.5s settlement time and minimal fees.",
    images: ["/seo_image.png"],
    creator: "@algosplit"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <WalletProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

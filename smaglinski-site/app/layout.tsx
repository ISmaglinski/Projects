import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteMetadata: Metadata = {
  title: {
    default: "The Smaglinskis | Three Brothers Who Build",
    template: "%s | Smaglinski",
  },
  description:
    "The shared portfolio of Ian, Jacob, and Isaac Smaglinski — spanning data, AI, software, custom hardware, and infrastructure.",
  applicationName: "Smaglinski",
  keywords: [
    "Smaglinski",
    "portfolio",
    "data analytics",
    "artificial intelligence",
    "computer science",
    "PC building",
    "home lab",
  ],
  authors: [
    { name: "Ian Smaglinski" },
    { name: "Jacob Smaglinski" },
    { name: "Isaac Smaglinski" },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Smaglinski",
    title: "Three brothers. One instinct: build.",
    description:
      "Data, AI, software, custom hardware, and infrastructure — built by the Smaglinskis.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1748,
        height: 909,
        alt: "Smaglinski — Three brothers. One instinct: build.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Three brothers. One instinct: build.",
    description:
      "The shared portfolio of Ian, Jacob, and Isaac Smaglinski.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const requestHost = forwardedHost?.split(",")[0].trim() || requestHeaders.get("host");
  const safeHost =
    requestHost && /^[a-z0-9.-]+(?::\d+)?$/i.test(requestHost)
      ? requestHost
      : "smaglinski.com";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : safeHost.startsWith("localhost") || safeHost.startsWith("127.0.0.1")
        ? "http"
        : "https";

  return {
    ...siteMetadata,
    metadataBase: new URL(`${protocol}://${safeHost}`),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070a0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

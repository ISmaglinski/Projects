import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./warm.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://127.0.0.1:3000"),
  title: {
    default: "The Smaglinskis | Three Brothers Who Build",
    template: "%s | Smaglinski",
  },
  description:
    "The local portfolio of Ian, Jacob, and Isaac Smaglinski, spanning data, AI, custom hardware, and infrastructure.",
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
      "Data, AI, custom hardware, and infrastructure, built by the Smaglinskis.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1748,
        height: 909,
        alt: "Smaglinski, three brothers who build",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Three brothers. One instinct: build.",
    description: "The shared portfolio of Ian, Jacob, and Isaac Smaglinski.",
    images: ["/og.png"],
  },
};

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
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

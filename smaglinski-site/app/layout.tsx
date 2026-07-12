import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./warm.css";

const themeBootstrap = `
(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = "system";

  try {
    const stored = localStorage.getItem("smaglinski-theme");
    if (stored === "system" || stored === "light" || stored === "dark") {
      preference = stored;
    }
  } catch {}

  const resolved =
    preference === "system"
      ? (media.matches ? "dark" : "light")
      : preference;

  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#151713" : "#f3efe7");
  }
})();
`;

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Three brothers. One instinct: build.",
    description: "The shared portfolio of Ian, Jacob, and Isaac Smaglinski.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#f3efe7" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarProvider";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";
import { VersionBadge } from "@/components/VersionBadge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://autopilot-cli.vercel.app'),
  title: {
    template: '%s | Autopilot CLI',
    default: 'Autopilot CLI',
  },
  description: "Intelligent Git automation with safety rails",
  keywords: ['git', 'automation', 'cli', 'productivity', 'developer-tools'],
  authors: [{ name: 'PraiseTech' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Autopilot CLI',
    title: 'Autopilot CLI',
    description: 'Intelligent Git automation with safety rails',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Autopilot CLI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autopilot CLI',
    description: 'Intelligent Git automation with safety rails',
    images: ['/og-image.png'],
    creator: '@PraiseTechzw',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider defaultTheme="system" storageKey="autopilot-theme">
          <SidebarProvider>
            <Topbar versionBadge={<VersionBadge />} />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarProvider";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";
import { VersionBadge } from "@/components/VersionBadge";
import { MobileMenu } from "@/components/MobileMenu";

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
    default: 'Autopilot CLI - Intelligent Git Automation',
  },
  description: "Automate your Git workflow with Autopilot CLI. Smart commits, background syncing, and safety rails for developers.",
  keywords: ['git', 'automation', 'cli', 'productivity', 'developer-tools', 'git-workflow', 'open-source', 'devops'],
  authors: [{ name: 'PraiseTech', url: 'https://github.com/PraiseTechzw' }],
  creator: 'PraiseTech',
  publisher: 'PraiseTech',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Autopilot CLI',
    title: 'Autopilot CLI - Intelligent Git Automation',
    description: 'Stop worrying about commits. Autopilot CLI watches your changes and syncs them automatically with safety rails.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Autopilot CLI Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autopilot CLI',
    description: 'Intelligent Git automation with safety rails. Focus on code, not commits.',
    images: ['/og-image.svg'],
    creator: '@PraiseTechzw',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico', // Ideally we should have a real apple-touch-icon
  },
  manifest: '/manifest.json',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'autopilot-theme';
                  var theme = localStorage.getItem(storageKey);
                  var support = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var d = document.documentElement;
                  d.classList.remove('light', 'dark');
                  if (theme === 'dark' || (!theme && support)) {
                    d.classList.add('dark');
                  } else {
                    d.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="system" storageKey="autopilot-theme">
          <SidebarProvider>
            <Topbar versionBadge={<VersionBadge />} />
            <MobileMenu />
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

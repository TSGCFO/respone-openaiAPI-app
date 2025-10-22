import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { F7AppProvider } from "@/components/f7-app-provider";
import "./globals.css";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "AI Chat Assistant",
  description: "Native Android-style AI chat with OpenAI integration",
  icons: {
    icon: "/openai_logo.svg",
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Chat',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#9c27b0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#9c27b0" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={roboto.className}>
        <F7AppProvider>
          <div id="app">
            {children}
          </div>
        </F7AppProvider>
      </body>
    </html>
  );
}
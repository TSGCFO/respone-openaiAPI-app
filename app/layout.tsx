import type { Metadata, Viewport } from "next";
import { F7AppProvider } from "@/components/f7-app-provider";
import "./globals.css";

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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#9c27b0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#9c27b0" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <F7AppProvider>
          <div id="app">
            {children}
          </div>
        </F7AppProvider>
      </body>
    </html>
  );
}
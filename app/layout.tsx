import type { Metadata, Viewport } from "next";
import { MaterialThemeProvider } from "@/components/theme/MaterialThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Responses starter app",
  description: "Starter app for the OpenAI Responses API",
  icons: {
    icon: "/openai_logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Responses App',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5EEFA' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1B1F' },
  ],
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        <MaterialThemeProvider>
          <div className="flex h-screen w-full flex-col">
            <main>{children}</main>
          </div>
        </MaterialThemeProvider>
      </body>
    </html>
  );
}
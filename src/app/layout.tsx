import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Navbar } from '@/components/ui/Navbar'
import './global.css'
import "@/styles/navbar.css"

export const metadata: Metadata = {
  title: "CECFO Worship Training",
  description: "Worship training sheets with jianpu notation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/cecfo-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#141A14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Navbar />
        {children}
        <Script src="/register-sw.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
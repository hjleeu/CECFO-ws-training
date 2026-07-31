import { Navbar } from '@/components/ui/Navbar'
import './global.css'
import "@/styles/navbar.css"

export const metadata = {
  title: "CECFO Worship Training",
  description: "Worship training sheets with jianpu notation",
  manifest: "/manifest.json"
}

export const viewport = {
  themeColor: "#F4F3EE"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F3EE" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#141A14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/cecfo-192.png" />
        <script src="/register-sw.js" defer />
      </head>
      <body>
        <Navbar></Navbar>
        {children}
      </body>
    </html>
  )
}
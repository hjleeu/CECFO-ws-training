import './global.css'

export const metadata = {
  title: "CECFO Worship Training",
  description: "",
  manifest: "/manifest.json",
  themeColor: ""
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
        <link rel="apple-touch-icon" href="/icons/cecfo-192.png" />
        <script src="/register-sw.js" defer />
      </head>
      <body>{children}</body>
    </html>
  )
}
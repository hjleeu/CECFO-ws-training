import './global.css'

export const metadata = {
  title: 'CECFO Worship Training',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BetterGI脚本仓库',
  description: '由Because重写，一个新的BetterGI脚本仓库前端界面。',
  generator: 'https://github.com/Because66666',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

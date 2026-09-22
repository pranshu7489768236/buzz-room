import type { Metadata } from "next"
import { profile } from "@/lib/content"
import "./globals.css"

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.intro,
}

export const viewport = {
  themeColor: "#0b0c0e",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}

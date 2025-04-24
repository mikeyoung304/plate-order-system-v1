import type React from "react"
import ClientLayout from "./ClientLayout"

export const metadata = {
  title: "Plate | Voice Ordering System",
  description: "Modern restaurant order management system with voice recognition",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>;
}

// Removed redundant import './globals.css' (it's imported in ClientLayout)
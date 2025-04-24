"use client"

import type React from "react"
import "./globals.css"
import { Inter, Roboto } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
})

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Add system fonts fallback for SF Pro */}
        <style jsx global>{`
          @font-face {
            font-family: 'SF Pro Display';
            src: local(-apple-system), local(BlinkMacSystemFont);
            font-weight: normal;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'SF Pro Text';
            src: local(-apple-system), local(BlinkMacSystemFont);
            font-weight: normal;
            font-style: normal;
          }
        `}</style>
      </head>
      <body className={cn("min-h-screen bg-[#1a1a24] font-sans antialiased", inter.variable, roboto.variable)}>
        <ThemeProvider defaultTheme="dark" attribute="class">
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

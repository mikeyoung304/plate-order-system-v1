"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ShellProps {
  children: React.ReactNode
  className?: string
}

export function Shell({ children, className }: ShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a24]">
        <div className="h-20 w-20 animate-spin rounded-full border-t-4 border-white" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen overflow-hidden bg-gradient-to-br from-[#1a1a24] via-[#1e1e2d] to-[#1a1a24]"
    >
      <Sidebar />
      <main className={cn("flex-1 overflow-auto relative", className)}>
        {/* Subtle vignette effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-transparent to-black/20 z-0"></div>

        {children}
      </main>
    </motion.div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false); // State to track client-side mount

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        const x = e.clientX / width - 0.5
        const y = e.clientY / height - 0.5
        setMousePosition({ x, y })
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, []);

  // Set mounted state only on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEnter = () => {
    setShowDashboard(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  return (
    // Simplified version for debugging visibility
    <div ref={containerRef} className="h-screen w-screen overflow-hidden text-white relative bg-gray-900">
      {/* Removed AnimatePresence and motion.div wrappers */}
      {!showDashboard ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Removed background, particles, grid */}

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo container - Removed motion */}
            <div
              className="relative cursor-pointer"
              style={{
                // transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`, // Removed parallax
              }}
              onClick={handleEnter}
            >
              {/* Removed Glow effects */}
              {/* Removed Logo stroke animation */}
              <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                {/* Actual logo */}
                <Link href="/dashboard">
                  <div className="relative w-[400px] h-[400px]">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Plate_Logo_HighRes_Transparent-KHpujinpES74Q3nyKx1Nd3ogN1r9t7.png"
                      alt="Plate Logo"
                      fill
                      className="object-contain drop-shadow-2xl"
                      style={{ filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))" }}
                      priority
                    />
                  </div>
                </Link>
              </div>
            </div>

            {/* Tagline - Removed motion */}
            <div className="mt-8 text-center">
              <h2 className="text-3xl md:text-4xl font-light tracking-wide text-white/90 sf-pro-display">
                modern restaurant solutions
              </h2>
              <p className="mt-4 text-base text-white/60 max-w-md mx-auto sf-pro-text">
                Streamlined ordering and kitchen management for modern dining experiences
              </p>
            </div>

            {/* Enter button - Removed motion */}
            <div className="mt-12">
              <Button
                onClick={handleEnter}
                className="px-10 py-6 text-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 rounded-full transition-all duration-300 sf-pro-text shadow-lg hover:shadow-xl group relative overflow-hidden"
              >
                <span className="relative z-10">Enter</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#783c8c]/40 to-[#1e50aa]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Button>
            </div>
          </div> {/* Closing main content div */}
        </div> // Closing main conditional div
      ) : (
        // Loading/Transition state - Removed motion
        <div className="absolute inset-0 bg-[#1a1a24]">
          <div className="flex h-full items-center justify-center">
            <div className="h-20 w-20 animate-spin rounded-full border-t-4 border-white" />
          </div>
        </div>
      )} {/* Closing !showDashboard conditional */}
      {/* Removed AnimatePresence */}
    </div> // Closing main container div
  ); // Closing return statement
} // Closing component function

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shell } from "@/components/shell"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Utensils, ChefHat, Shield, Settings, Clock } from "lucide-react"

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
  }

  return (
    <Shell>
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>

      <div className="container py-8 md:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight sf-pro-display text-white drop-shadow-sm">
              Welcome to Plate
            </h1>
            <p className="mt-2 text-gray-400 sf-pro-text font-light">What would you like to do today?</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-800/50 shadow-inner">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-300 sf-pro-text">{formatTime(currentTime)}</span>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={item} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Link href="/server" className="block h-full">
              <Card className="h-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group shadow-xl hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col h-full relative">
                    {/* Subtle glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors duration-300 shadow-inner">
                      <Utensils className="w-6 h-6 text-blue-400 drop-shadow" />
                    </div>
                    <h2 className="text-xl font-medium sf-pro-display mb-2 text-white drop-shadow-sm">Server View</h2>
                    <p className="text-gray-400 sf-pro-text font-light text-sm">Take orders and manage tables</p>
                    <div className="mt-auto pt-6">
                      <div className="text-blue-400 text-sm sf-pro-text group-hover:translate-x-1 transition-transform duration-300">
                        Get started →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Link href="/kitchen" className="block h-full">
              <Card className="h-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group shadow-xl hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col h-full relative">
                    {/* Subtle glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors duration-300 shadow-inner">
                      <ChefHat className="w-6 h-6 text-amber-400 drop-shadow" />
                    </div>
                    <h2 className="text-xl font-medium sf-pro-display mb-2 text-white drop-shadow-sm">Kitchen View</h2>
                    <p className="text-gray-400 sf-pro-text font-light text-sm">Manage food preparation</p>
                    <div className="mt-auto pt-6">
                      <div className="text-amber-400 text-sm sf-pro-text group-hover:translate-x-1 transition-transform duration-300">
                        Get started →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Link href="/expo" className="block h-full">
              <Card className="h-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group shadow-xl hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col h-full relative">
                    {/* Subtle glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors duration-300 shadow-inner">
                      <Shield className="w-6 h-6 text-green-400 drop-shadow" />
                    </div>
                    <h2 className="text-xl font-medium sf-pro-display mb-2 text-white drop-shadow-sm">Expo View</h2>
                    <p className="text-gray-400 sf-pro-text font-light text-sm">Manage order delivery</p>
                    <div className="mt-auto pt-6">
                      <div className="text-green-400 text-sm sf-pro-text group-hover:translate-x-1 transition-transform duration-300">
                        Get started →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Link href="/admin" className="block h-full">
              <Card className="h-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group shadow-xl hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col h-full relative">
                    {/* Subtle glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors duration-300 shadow-inner">
                      <Settings className="w-6 h-6 text-purple-400 drop-shadow" />
                    </div>
                    <h2 className="text-xl font-medium sf-pro-display mb-2 text-white drop-shadow-sm">Admin</h2>
                    <p className="text-gray-400 sf-pro-text font-light text-sm">Configure system settings</p>
                    <div className="mt-auto pt-6">
                      <div className="text-purple-400 text-sm sf-pro-text group-hover:translate-x-1 transition-transform duration-300">
                        Get started →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Shell>
  )
}

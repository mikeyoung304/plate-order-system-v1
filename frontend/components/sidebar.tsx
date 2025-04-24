"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LayoutDashboard, Utensils, ChefHat, Shield, Settings, Menu, X, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState(3) // Example notification count
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Reset mobile menu state when screen size changes
  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      setIsMobileOpen(false)
    }

    // Auto-collapse sidebar on mobile if needed (optional)
    // if (isMobile && !collapsed) {
    //   setCollapsed(true)
    // }
  }, [isMobile, isMobileOpen]) // Removed collapsed from deps if not auto-collapsing

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Server",
      href: "/server",
      icon: <Utensils className="w-5 h-5" />,
    },
    {
      name: "Kitchen",
      href: "/kitchen",
      icon: <ChefHat className="w-5 h-5" />,
      badge: 5, // Example badge count
    },
    {
      name: "Expo",
      href: "/expo",
      icon: <Shield className="w-5 h-5" />,
      badge: 2, // Example badge count
    },
    {
      name: "Admin",
      href: "/admin",
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  }

  const renderNavItems = () => (
    <motion.ul variants={container} initial="hidden" animate="show" className="space-y-1 px-2">
      {navItems.map((navItem) => ( // Renamed inner variable to avoid conflict
        <motion.li key={navItem.href} variants={item}>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={navItem.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors relative group sf-pro-text",
                    pathname === navItem.href
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                  onClick={() => isMobile && setIsMobileOpen(false)} // Close mobile menu on click
                >
                  <span className="mr-3">{navItem.icon}</span>
                  {/* Always show name in mobile sheet, hide based on collapsed state otherwise */}
                  {(isMobileOpen || !collapsed) && <span>{navItem.name}</span>}
                  {navItem.badge && (
                    <Badge
                      variant="default"
                      className={cn(
                        "ml-auto bg-teal-600 text-white text-xs px-1.5 py-0.5", // Adjusted padding/size
                        (collapsed && !isMobileOpen) && "absolute -right-1 -top-1 h-4 w-4 justify-center p-0" // Adjusted positioning for collapsed
                      )}
                    >
                      {navItem.badge}
                    </Badge>
                  )}
                </Link>
              </TooltipTrigger>
              {/* Show tooltip only when collapsed and not in mobile sheet */}
              {(collapsed && !isMobileOpen) && <TooltipContent side="right">{navItem.name}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </motion.li>
      ))}
    </motion.ul>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 bg-black/20 backdrop-blur-sm" aria-label="Open Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#1a1a24] border-gray-800 flex flex-col"> {/* Added flex flex-col */}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center">
                <div className="relative h-8 w-8 mr-2">
                  <Image src="/images/plate-logo-white.png" alt="Plate Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-semibold sf-pro-display">Plate</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} aria-label="Close Menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow py-4 overflow-y-auto">{renderNavItems()}</nav>

            {/* Footer/User Area */}
            <div className="p-4 border-t border-gray-800 mt-auto"> {/* Added mt-auto */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    {/* Replace with actual user image or fallback */}
                    {/* <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" /> */}
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium sf-pro-text">John Doe</p>
                    <p className="text-xs text-gray-400 sf-pro-text">Server</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Log Out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div // This is the start of the desktop return (line 179 in original)
      className={cn(
        "hidden md:flex flex-col h-screen bg-[#1a1a24] border-r border-gray-800 transition-all duration-300 ease-in-out", // Added hidden md:flex
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <div className="relative h-8 w-8 mr-2">
            <Image src="/images/plate-logo-white.png" alt="Plate Logo" fill className="object-contain" />
          </div>
          {!collapsed && <span className="text-xl font-semibold sf-pro-display">Plate</span>}
        </div>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {/* Use different icons for collapse/expand */}
                {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-4 overflow-y-auto">{renderNavItems()}</nav>

      {/* Footer/User Area */}
      <div className="p-4 border-t border-gray-800 mt-auto"> {/* Added mt-auto */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Wrap clickable area if needed, or apply directly */}
              <div className="flex items-center cursor-pointer">
                <Avatar className="h-8 w-8 mr-3">
                   {/* Replace with actual user image or fallback */}
                  {/* <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" /> */}
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div>
                    <p className="text-sm font-medium sf-pro-text">John Doe</p>
                    <p className="text-xs text-gray-400 sf-pro-text">Server</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {/* Show tooltip only when collapsed */}
            {collapsed && <TooltipContent side="right">John Doe (Server)</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

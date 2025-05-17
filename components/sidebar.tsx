"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LayoutDashboard, Utensils, ChefHat, Shield, Settings, Menu, X, LogOut, ChevronLeft } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/AuthContext"

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

type UserRole = {
  role: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, signOut, userRole, userName } = useAuth()
  const { toast } = useToast()

  // Reset mobile menu state when screen size changes
  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      setIsMobileOpen(false)
    }
  }, [isMobile, isMobileOpen])

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Server",
      href: "/server",
      icon: <Utensils className="h-5 w-5" />,
      badge: 2,
    },
    {
      name: "Kitchen",
      href: "/kitchen",
      icon: <ChefHat className="h-5 w-5" />,
      badge: 5,
    },
    {
      name: "Expo",
      href: "/expo",
      icon: <Shield className="h-5 w-5" />,
      badge: 2,
    },
    {
      name: "Admin",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      router.refresh()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderNavItems = () => (
    <motion.ul variants={container} initial="hidden" animate="show" className="space-y-1 px-2">
      {navItems.map((navItem) => (
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
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <span className="mr-3">{navItem.icon}</span>
                  {(isMobileOpen || !collapsed) && <span>{navItem.name}</span>}
                  {navItem.badge && (
                    <Badge
                      variant="default"
                      className="ml-auto bg-blue-600 hover:bg-blue-600"
                    >
                      {navItem.badge}
                    </Badge>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side="right">
                  <p>{navItem.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </motion.li>
      ))}
    </motion.ul>
  )

  // In the mobile view
  const userInfoSection = (
    <div className="p-4 border-t border-gray-800 mt-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{userName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium sf-pro-text">{userName || 'User'}</p>
            <p className="text-xs text-gray-400 sf-pro-text capitalize">{userRole || 'Loading...'}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  // In the desktop view
  const desktopUserInfoSection = (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
            <AvatarFallback>{userName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium sf-pro-text truncate">{userName || 'User'}</p>
              <p className="text-xs text-gray-400 sf-pro-text capitalize">{userRole || 'Loading...'}</p>
            </div>
          )}
        </div>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="w-64 bg-[#1a1a24] border-r border-gray-800 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4">
                <Image
                  src="/images/plate-logo-white.png"
                  alt="Logo"
                  width={32}
                  height={32}
                />
              </div>

              {renderNavItems()}

              {userInfoSection}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "bg-[#1a1a24] border-r border-gray-800 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <Image
          src="/images/plate-logo-white.png"
          alt="Logo"
          width={32}
          height={32}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {renderNavItems()}

      {desktopUserInfoSection}
    </div>
  )
}

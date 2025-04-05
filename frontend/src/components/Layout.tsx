import React from "react";
import { NavLink } from "react-router-dom"; // Import NavLink
// Import necessary icons
import {
  UserIcon, // Server
  CogIcon, // Admin (using Cog temporarily)
  FireIcon, // Kitchen
  CheckCircleIcon, // Expeditor
  BuildingOfficeIcon, // Room Service
  HeartIcon, // Memory Care
  AdjustmentsHorizontalIcon, // Settings
} from "@heroicons/react/24/outline";

// Define navigation structure
interface RoleNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const roleNavigation: RoleNavItem[] = [
  { name: "Server", href: "/", icon: UserIcon },
  { name: "Kitchen", href: "/kitchen", icon: FireIcon },
  { name: "Expeditor", href: "/expeditor", icon: CheckCircleIcon },
  { name: "Room Svc", href: "/room-service", icon: BuildingOfficeIcon },
  { name: "Memory Care", href: "/memory-care", icon: HeartIcon },
  { name: "Admin", href: "/admin", icon: CogIcon }, // Floor plan editor
  { name: "Settings", href: "/settings", icon: AdjustmentsHorizontalIcon },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    // Apply dark mode base styles defined in index.css via html.dark
    <div className="flex flex-col min-h-screen bg-dark-primary text-dark-text">
      {/* Main content area - takes up remaining space */}
      {/* Ensure main area can shrink and grow, and establish a height context for children */}
      {/* Ensure main area fills space and provides flex context */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
        {" "}
        {/* Removed overflow-y-auto */}
        {/* Content from Routes will be rendered here */}
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="sticky bottom-0 z-50 border-t border-dark-border bg-dark-secondary shadow-md">
        <div className="flex h-16 items-center justify-around px-2 sm:px-4">
          {roleNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              // Handle root path matching exactly for Server view
              end={item.href === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-grow px-1 pt-1 text-xs font-medium transition-colors duration-150 ease-in-out focus:outline-none
                ${
                  isActive
                    ? "text-blue-400 border-t-2 border-blue-400" // Active state style
                    : "text-dark-text-secondary hover:text-dark-text border-t-2 border-transparent" // Inactive state style
                }`
              }
            >
              <item.icon className="h-6 w-6 mb-1" aria-hidden="true" />
              <span className="text-center truncate w-full">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

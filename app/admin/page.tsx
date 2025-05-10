"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FloorPlanEditor } from "@/components/floor-plan-editor"
import { TableList } from "@/components/table-list"
import { PrinterSettings } from "@/components/printer-settings"

export default function AdminPage() {
  const [floorPlanId, setFloorPlanId] = useState("default")
  const [activeTab, setActiveTab] = useState("analytics")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for analytics
  const salesData = [
    { day: "Mon", amount: 1200 },
    { day: "Tue", amount: 1800 },
    { day: "Wed", amount: 1400 },
    { day: "Thu", amount: 2200 },
    { day: "Fri", amount: 2800 },
    { day: "Sat", amount: 3200 },
    { day: "Sun", amount: 2600 },
  ]

  const popularItems = [
    { name: "Grilled Salmon", count: 24, percent: 18 },
    { name: "Chicken Parmesan", count: 18, percent: 14 },
    { name: "Ribeye Steak", count: 16, percent: 12 },
    { name: "Vegetable Pasta", count: 14, percent: 11 },
    { name: "Caesar Salad", count: 12, percent: 9 },
  ]

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-lg font-medium">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
              <TabsTrigger value="printer">Printer</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Today's Sales</h3>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">$2,854</p>
                  <p className="text-sm text-muted-foreground mt-2">+12% from yesterday</p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Orders</h3>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">128</p>
                  <p className="text-sm text-muted-foreground mt-2">+8% from yesterday</p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Avg. Order Value</h3>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <path d="M12 2v20" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">$22.30</p>
                  <p className="text-sm text-muted-foreground mt-2">+4% from last week</p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Active Tables</h3>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold">12/24</p>
                  <p className="text-sm text-muted-foreground mt-2">50% occupancy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium mb-4">Weekly Sales</h3>
                  <div className="chart-container">
                    <div className="flex h-full items-end">
                      {salesData.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full max-w-[40px] bg-primary/20 rounded-t-sm"
                            style={{
                              height: `${(item.amount / 3200) * 100}%`,
                            }}
                          ></div>
                          <div className="mt-2 text-xs text-muted-foreground">{item.day}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-medium mb-4">Popular Items</h3>
                  <ul className="space-y-4">
                    {popularItems.map((item) => (
                      <li key={item.name} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.count} orders</p>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="10"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeDasharray={`${item.percent * 2.51} 251`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                            />
                            <text x="50" y="55" textAnchor="middle" fontSize="20" fill="currentColor">
                              {item.percent}%
                            </text>
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="floor-plan">
              <div className="bg-card p-6 rounded-lg border border-border">
                <FloorPlanEditor floorPlanId={floorPlanId} />
              </div>
            </TabsContent>

            <TabsContent value="printer">
              <div className="bg-card p-6 rounded-lg border border-border">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    <span className="ml-2">Loading printer settings...</span>
                  </div>
                ) : (
                  <PrinterSettings />
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-medium mb-4">Tables</h3>
                  <TableList floorPlanId={floorPlanId} />
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-medium mb-4">System Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
                        defaultValue="Plate Restaurant"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Theme</label>
                      <select className="w-full px-3 py-2 bg-secondary border border-border rounded-md">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Order Notification Sound</label>
                      <select className="w-full px-3 py-2 bg-secondary border border-border rounded-md">
                        <option value="chime">Chime</option>
                        <option value="bell">Bell</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

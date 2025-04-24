"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Printer, Check, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { testPrinterConnection, updatePrinterConfig, getPrinterStatus } from "@/services/printer-service"

export function PrinterSettings() {
  const [printerIP, setPrinterIP] = useState("192.168.1.100")
  const [printFoodOrders, setPrintFoodOrders] = useState(false)
  const [printDrinkOrders, setPrintDrinkOrders] = useState(false)
  const [isTestingPrinter, setIsTestingPrinter] = useState(false)
  const [printerConnected, setPrinterConnected] = useState(false)
  const { toast } = useToast()

  // Load saved settings
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("printerSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setPrinterIP(settings.printerIP || "192.168.1.100")
        setPrintFoodOrders(settings.printFoodOrders || false)
        setPrintDrinkOrders(settings.printDrinkOrders || false)
      }

      // Check initial printer status
      setPrinterConnected(getPrinterStatus())
    } catch (error) {
      console.error("Error loading printer settings:", error)
    }
  }, [])

  // Save settings
  const saveSettings = () => {
    try {
      const settings = {
        printerIP,
        printFoodOrders,
        printDrinkOrders,
      }
      localStorage.setItem("printerSettings", JSON.stringify(settings))

      // Update printer config with new IP
      updatePrinterConfig({
        ipAddress: printerIP,
      })

      toast({
        title: "Settings saved",
        description: "Printer settings have been updated",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving printer settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your printer settings",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Test printer connection
  const testPrinter = async () => {
    setIsTestingPrinter(true)

    try {
      // Update printer config with current IP
      await updatePrinterConfig({
        ipAddress: printerIP,
      })

      const result = await testPrinterConnection()
      setPrinterConnected(result)

      if (result) {
        toast({
          title: "Printer connected",
          description: "Test page printed successfully",
          duration: 3000,
        })
      } else {
        toast({
          title: "Printer connection failed",
          description:
            "Could not connect to the printer. Please check the IP address and ensure the printer is online.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error testing printer:", error)
      setPrinterConnected(false)
      toast({
        title: "Printer test failed",
        description: "An error occurred while testing the printer connection",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsTestingPrinter(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-gray-400" />
          <CardTitle>Kitchen Printer Settings</CardTitle>
        </div>
        <CardDescription>Configure your Epson Star SP 700 printer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-400">Demo Mode</h4>
              <p className="text-xs text-blue-300/80 mt-1">
                This is a simulation of printer functionality. In a production environment, this would connect to a real
                Epson Star SP 700 printer via a backend service.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="printer-ip">Printer IP Address</Label>
          <div className="flex gap-2">
            <Input
              id="printer-ip"
              value={printerIP}
              onChange={(e) => setPrinterIP(e.target.value)}
              placeholder="192.168.1.100"
              className="bg-gray-800/50 border-gray-700"
            />
            <Button onClick={testPrinter} disabled={isTestingPrinter} variant="outline" className="gap-2">
              {isTestingPrinter ? (
                <>Testing...</>
              ) : (
                <>
                  {printerConnected ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  Test
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Enter the IP address of your Epson Star SP 700 printer</p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-food" className="text-sm font-medium">
                Print Food Orders
              </Label>
              <p className="text-xs text-gray-500 mt-1">Automatically print food orders to the kitchen printer</p>
            </div>
            <Switch id="print-food" checked={printFoodOrders} onCheckedChange={setPrintFoodOrders} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-drink" className="text-sm font-medium">
                Print Drink Orders
              </Label>
              <p className="text-xs text-gray-500 mt-1">Automatically print drink orders to the kitchen printer</p>
            </div>
            <Switch id="print-drink" checked={printDrinkOrders} onCheckedChange={setPrintDrinkOrders} />
          </div>
        </div>

        <Button onClick={saveSettings} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
          Save Printer Settings
        </Button>
      </CardContent>
    </Card>
  )
}

// Mock printer service for browser environment
// In a real implementation, this would communicate with a backend API

// Printer configuration
type PrinterConfig = {
  ipAddress: string
  port?: number
  width?: number
  characterSet?: string
}

// Default configuration
let printerConfig: PrinterConfig = {
  ipAddress: "192.168.1.100",
  port: 9100,
  width: 42, // Number of characters per line
  characterSet: "UTF-8",
}

// Mock printer connection status
let isPrinterConnected = false

// Add caching for printer status to reduce redundant operations
let lastConnectionAttempt = 0
const CONNECTION_CACHE_TIME = 30000 // 30 seconds

// Initialize printer connection
export const initializePrinter = async (config?: Partial<PrinterConfig>): Promise<boolean> => {
  try {
    // Update config if provided
    if (config) {
      printerConfig = { ...printerConfig, ...config }
    }

    const now = Date.now()

    // Use cached result if recent
    if (now - lastConnectionAttempt < CONNECTION_CACHE_TIME) {
      console.log("Using cached printer connection status:", isPrinterConnected)
      return isPrinterConnected
    }

    // In a real implementation, this would attempt to connect to the printer
    console.log("Initializing printer with config:", printerConfig)

    // Simulate connection success (80% of the time)
    isPrinterConnected = Math.random() < 0.8
    lastConnectionAttempt = now

    return isPrinterConnected
  } catch (error) {
    console.error("Error initializing printer:", error)
    isPrinterConnected = false
    return false
  }
}

// Print food order ticket
export const printFoodOrder = async (order: any): Promise<boolean> => {
  // Check if printer is connected
  if (!isPrinterConnected) {
    console.error("Printer not connected")
    return false
  }

  try {
    // Get printer settings from localStorage
    const settingsStr = localStorage.getItem("printerSettings")
    const settings = settingsStr ? JSON.parse(settingsStr) : {}

    if (!settings.printFoodOrders) {
      console.log("Food order printing disabled in settings")
      return true // Return true as this is an intentional skip
    }

    // In a real implementation, this would format and send the ticket to the printer
    console.log("Printing food order:", order)

    // Format ticket (for logging purposes)
    const ticket = [
      "===== FOOD ORDER =====",
      `Table: ${order.table}`,
      `Seat: ${order.seat}`,
      `Time: ${new Date().toLocaleTimeString()}`,
      "---------------------",
      ...order.orderText.split(",").map((item: string, index: number) => `${index + 1}. ${item.trim()}`),
      "---------------------",
      `Order ID: ${order.id}`,
    ].join("\n")

    console.log("Ticket content:\n", ticket)

    // Simulate successful printing
    return true
  } catch (error) {
    console.error("Error printing food order:", error)
    return false
  }
}

// Print drink order ticket
export const printDrinkOrder = async (order: any): Promise<boolean> => {
  // Check if printer is connected
  if (!isPrinterConnected) {
    console.error("Printer not connected")
    return false
  }

  try {
    // Get printer settings from localStorage
    const settingsStr = localStorage.getItem("printerSettings")
    const settings = settingsStr ? JSON.parse(settingsStr) : {}

    if (!settings.printDrinkOrders) {
      console.log("Drink order printing disabled in settings")
      return true // Return true as this is an intentional skip
    }

    // In a real implementation, this would format and send the ticket to the printer
    console.log("Printing drink order:", order)

    // Format ticket (for logging purposes)
    const ticket = [
      "===== DRINK ORDER =====",
      `Table: ${order.table}`,
      `Seat: ${order.seat}`,
      `Time: ${new Date().toLocaleTimeString()}`,
      "----------------------",
      ...order.orderText.split(",").map((item: string, index: number) => `${index + 1}. ${item.trim()}`),
      "----------------------",
      `Order ID: ${order.id}`,
    ].join("\n")

    console.log("Ticket content:\n", ticket)

    // Simulate successful printing
    return true
  } catch (error) {
    console.error("Error printing drink order:", error)
    return false
  }
}

// Update printer configuration
export const updatePrinterConfig = async (config: Partial<PrinterConfig>): Promise<boolean> => {
  printerConfig = { ...printerConfig, ...config }
  return initializePrinter(printerConfig)
}

// Test printer connection
export const testPrinterConnection = async (): Promise<boolean> => {
  try {
    // In a real implementation, this would send a test page to the printer
    console.log("Testing printer connection to:", printerConfig.ipAddress)

    // Simulate connection test (70% success rate)
    const success = Math.random() < 0.7

    if (success) {
      console.log("Printer test successful")
      isPrinterConnected = true
    } else {
      console.log("Printer test failed")
      isPrinterConnected = false
    }

    return success
  } catch (error) {
    console.error("Error testing printer:", error)
    isPrinterConnected = false
    return false
  }
}

// Get printer connection status
export const getPrinterStatus = (): boolean => {
  return isPrinterConnected
}

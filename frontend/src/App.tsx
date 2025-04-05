import React, { useEffect } from "react"; // Import useEffect
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
// Import Dashboard from './components/Dashboard'; // Keep Dashboard import if needed elsewhere, but don't render at root
import OrderInterface from "./components/OrderInterface";
import TableManagement from "./components/TableManagement"; // Used for Server floor plan AND Admin editor
import Settings from "./components/Settings";
// Import new view components
import KitchenDisplay from "./components/KitchenDisplay";
import ExpeditorView from "./components/ExpeditorView";
import RoomServiceOrder from "./components/RoomServiceOrder";
import MemoryCareOrder from "./components/MemoryCareOrder";

const App: React.FC = () => {
  // Apply dark mode class on component mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
    // Optional: Add cleanup function to remove class on unmount if needed
    // return () => {
    //   document.documentElement.classList.remove('dark');
    // };
  }, []); // Empty dependency array ensures this runs only once

  // *** ADDED DEBUG LOG ***
  console.log("[App.tsx] Rendering App component");

  return (
    <Layout>
      <Routes>
        {/* Server View (Floor Plan) - Root path */}
        <Route path="/" element={<TableManagement />} />
        {/* Admin View (Floor Plan Editor) */}
        <Route path="/admin" element={<TableManagement />} />
        {/* Order Interface (used by Server, Room Service, Memory Care flows) */}
        {/* Keep existing route for table service */}
        <Route path="/order/:tableId/:seatId" element={<OrderInterface />} />
        {/* Add routes for other order types if needed, or handle within OrderInterface */}
        <Route path="/room-service" element={<RoomServiceOrder />} />
        <Route path="/memory-care" element={<MemoryCareOrder />} />
        {/* Kitchen Display System */}
        <Route path="/kitchen" element={<KitchenDisplay />} />
        {/* Expeditor View */}
        <Route path="/expeditor" element={<ExpeditorView />} />
        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
        {/* Optional: Redirect or 404 for unknown routes */}
      </Routes>
    </Layout>
  );
};

export default App;

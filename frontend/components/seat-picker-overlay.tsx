// File: frontend/components/seat-picker-overlay.tsx
"use client"

import React from "react"; // Ensure React is imported
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Table } from "@/lib/floor-plan-utils"; // Use shared type

type SeatPickerOverlayProps = {
  table: Table | null;
  onClose: () => void;
  onSelectSeat: (seatNumber: number) => void;
};

// Enhanced visual representation of seats with animations
const Seat = ({ seatNumber, onClick }: { seatNumber: number; onClick: () => void }) => (
  <motion.button // Use button for better accessibility
    whileHover={{
      scale: 1.15, // More pronounced hover scale
      backgroundColor: "rgba(56, 189, 174, 0.4)", // Slightly stronger teal hover
      borderColor: "rgba(56, 189, 174, 0.9)",
      boxShadow: "0 0 15px rgba(56, 189, 174, 0.5)", // Add glow on hover
      transition: { type: "spring", stiffness: 400, damping: 15 }
    }}
    whileTap={{
      scale: 0.9, // Pop effect on tap
      backgroundColor: "rgba(13, 148, 136, 0.6)", // Darker teal on tap
      borderColor: "rgba(13, 148, 136, 1)",
      transition: { type: "spring", stiffness: 500, damping: 15 }
    }}
    // Initial state and base styling
    className="w-14 h-14 rounded-full border-2 flex items-center justify-center cursor-pointer bg-gray-700/60 border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-800"
    style={{
        // Ensure background color transitions smoothly if needed, though framer-motion handles it well
        transition: "background-color 0.2s ease-out, border-color 0.2s ease-out",
    }}
    onClick={onClick}
    aria-label={`Select Seat ${seatNumber}`}
  >
    <span className="font-medium text-lg text-gray-200">{seatNumber}</span>
  </motion.button>
);


export function SeatPickerOverlay({ table, onClose, onSelectSeat }: SeatPickerOverlayProps) {
  // Generate seat numbers from 1 to table.seats (only if table exists)
  const seatNumbers = table ? Array.from({ length: table.seats }, (_, i) => i + 1) : [];

  const handleSeatClick = (seatNumber: number) => {
    if (!table) return; // Should not happen if overlay is visible, but good practice
    console.log(`[SeatPicker] Seat ${seatNumber} selected for table ${table.label}`);
    onSelectSeat(seatNumber);
    // onClose(); // Keep overlay open until next step usually
  };

  return (
    // Use AnimatePresence to animate the overlay in/out
    <AnimatePresence>
      {table && ( // Conditionally render based on table prop
        <motion.div
          key="seat-picker-backdrop" // Key for backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose} // Close on backdrop click
        >
          {/* Inner modal content with its own animation */}
          <motion.div
            key="seat-picker-modal" // Key for modal content
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            className="bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700/50 h-9 w-9" // Corrected size
              onClick={onClose}
              aria-label="Close seat selection"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-1">Select Seat</h2>
              <p className="text-gray-400">Table {table.label} ({table.seats} seats)</p>
            </div>

            {/* Seat Grid */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {/* Corrected map call */}
              {seatNumbers.map((seatNum) => (
                <Seat
                  key={seatNum}
                  seatNumber={seatNum}
                  onClick={() => handleSeatClick(seatNum)}
                />
              ))}
            </div>

            {/* Optional: Add confirmation button if needed */}
            {/* <div className="mt-6 text-center">
              <Button onClick={onClose}>Cancel</Button>
            </div> */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
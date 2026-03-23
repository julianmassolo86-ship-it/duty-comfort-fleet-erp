import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

/**
 * Native-feeling Bottom Sheet for mobile.
 * Usage:
 *   <BottomSheet open={open} onClose={() => setOpen(false)} title="Filtrar">
 *     ...content
 *   </BottomSheet>
 *
 * height: "half" (50vh) | "auto" (fits content, max 90vh) | "full" (90vh)
 */
export default function BottomSheet({ open, onClose, title, children, height = "auto" }) {
  const { theme } = useTheme();
  const sheetRef = useRef(null);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const heightClass = {
    half: "max-h-[50vh]",
    auto: "max-h-[90vh]",
    full: "h-[90vh]",
  }[height] ?? "max-h-[90vh]";

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className={cn(
              "relative w-full rounded-t-3xl overflow-hidden flex flex-col",
              heightClass,
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className={cn("w-10 h-1 rounded-full", theme === "dark" ? "bg-zinc-700" : "bg-gray-300")} />
            </div>

            {/* Header */}
            {title && (
              <div className={cn(
                "flex items-center justify-between px-5 py-3 border-b flex-shrink-0",
                theme === "dark" ? "border-zinc-800" : "border-gray-100"
              )}>
                <h3 className={cn("text-base font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center rounded-full transition-colors",
                    theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
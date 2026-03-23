import React, { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";
import BottomSheet from "./BottomSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * On mobile (<1024px): opens a BottomSheet with 52px touch-friendly option rows.
 * On desktop: falls back to the standard shadcn Select.
 */
export default function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName }) {
  const { theme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        style={{ minHeight: "44px" }}
        className={cn(
          "flex items-center justify-between w-full px-3 rounded-lg border text-sm transition-colors",
          theme === "dark"
            ? "bg-slate-800/50 border-slate-700 text-white"
            : "bg-white border-gray-300 text-gray-900",
          triggerClassName
        )}
      >
        <span className={cn(!selectedLabel && (theme === "dark" ? "text-slate-500" : "text-gray-400"))}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 ml-2", theme === "dark" ? "text-slate-400" : "text-gray-400")} />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={placeholder || "Seleccionar"}
      >
        <div className="space-y-1 pb-safe">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onValueChange(opt.value); setSheetOpen(false); }}
              style={{ minHeight: "52px" }}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                value === opt.value
                  ? theme === "dark"
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-yellow-500/10 text-yellow-700"
                  : theme === "dark"
                  ? "text-zinc-200 active:bg-zinc-800"
                  : "text-gray-800 active:bg-gray-50"
              )}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <Check className={cn("w-5 h-5 flex-shrink-0", theme === "dark" ? "text-yellow-400" : "text-yellow-600")} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
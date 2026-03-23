import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";
import BottomSheet from "./BottomSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * On mobile: opens a BottomSheet with large touch-friendly options.
 * On desktop: falls back to the standard shadcn Select.
 *
 * Props mirror shadcn Select:
 *   value, onValueChange, placeholder, options: [{value, label}], className
 */
export default function MobileSelect({ value, onValueChange, placeholder, options = [], className, triggerClassName }) {
  const { theme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

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
        className={cn(
          "flex items-center justify-between w-full h-11 px-3 rounded-lg border text-sm transition-colors",
          theme === "dark"
            ? "bg-slate-800/50 border-slate-700 text-white"
            : "bg-white border-gray-300 text-gray-900",
          triggerClassName
        )}
      >
        <span className={cn(!value && (theme === "dark" ? "text-slate-500" : "text-gray-400"))}>
          {selectedLabel}
        </span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0", theme === "dark" ? "text-slate-400" : "text-gray-400")} />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={placeholder || "Seleccionar"}
        height="auto"
      >
        <div className="space-y-1 pb-4">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setSheetOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full min-h-[52px] px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                value === opt.value
                  ? theme === "dark"
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-yellow-500/10 text-yellow-700"
                  : theme === "dark"
                  ? "text-zinc-200 hover:bg-zinc-800"
                  : "text-gray-800 hover:bg-gray-50"
              )}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <Check className={cn("w-5 h-5", theme === "dark" ? "text-yellow-400" : "text-yellow-600")} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
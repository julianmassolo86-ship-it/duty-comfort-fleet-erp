import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

export default function ResponsiveSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  options = [], 
  label,
  className,
  triggerClassName,
  required = false,
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
            theme === 'dark' 
              ? 'bg-slate-800 border-slate-700 text-white' 
              : 'bg-white border-gray-300 text-gray-900',
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
        >
          <span className={!value ? (theme === 'dark' ? 'text-zinc-500' : 'text-gray-400') : ''}>
            {value ? options.find(o => o.value === value)?.label : placeholder}
          </span>
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}>
            <DrawerHeader>
              <DrawerTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{label || placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                    value === option.value 
                      ? theme === 'dark' 
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30'
                      : theme === 'dark'
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} required={required} disabled={disabled}>
      <SelectTrigger className={cn(className, triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { Tag } from "lucide-react";

export default function VehicleCategoryCard({ category, onClick }) {
  const { theme } = useTheme();
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg",
        theme === 'dark' 
          ? 'bg-zinc-900/50 border-zinc-800 hover:border-yellow-500/50' 
          : 'bg-white border-gray-200 hover:border-yellow-500'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              {category.name}
            </h3>
            {category.notes && (
              <p className={cn("text-sm mt-1", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                {category.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
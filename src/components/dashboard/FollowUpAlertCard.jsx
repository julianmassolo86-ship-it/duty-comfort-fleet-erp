import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

export default function FollowUpAlertCard({ vehicle, report }) {
  const { theme } = useTheme();

  return (
    <Link to={createPageUrl("Vehicles")}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer",
        theme === 'dark' 
          ? 'bg-zinc-800/50 border-amber-500/30 hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5' 
          : 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
      )}>
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
          <Eye className="w-5 h-5 text-amber-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              {vehicle.plate || vehicle.internal_number}
            </p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800')}>
              Requiere Seguimiento
            </span>
          </div>
          <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
            {vehicle.manufacturer} {vehicle.model}
          </p>
          {report?.observaciones_finales && (
            <p className={cn("text-xs mt-1 line-clamp-1", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
              {report.observaciones_finales}
            </p>
          )}
        </div>
        
        <ChevronRight className={cn("w-5 h-5", theme === 'dark' ? 'text-zinc-600' : 'text-gray-400')} />
      </div>
    </Link>
  );
}
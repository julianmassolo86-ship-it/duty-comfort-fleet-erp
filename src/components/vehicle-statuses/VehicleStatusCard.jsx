import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

export default function VehicleStatusCard({ status, onEdit, onDelete }) {
  const { theme } = useTheme();

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-2 overflow-hidden",
      theme === 'dark' 
        ? 'bg-zinc-900/50 border-zinc-800 hover:border-yellow-500/30' 
        : 'bg-white border-gray-200 hover:border-yellow-500/30'
    )}>
      <CardHeader className="pb-3 pr-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
              style={{ 
                backgroundColor: `${status.color}20`,
                borderColor: status.color
              }}
            >
              <Circle 
                className="w-6 h-6" 
                style={{ color: status.color }}
                fill={status.color}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-lg truncate",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {status.name}
              </h3>
              <p className={cn(
                "text-sm font-mono truncate",
                theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
              )}>
                {status.code}
              </p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(status)}
              className={cn(
                "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(status.id)}
              className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.description && (
          <p className={cn(
            "text-sm line-clamp-2",
            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          )}>
            {status.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className={cn(
            "px-2 py-1 rounded-full",
            status.is_active 
              ? theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
              : theme === 'dark' ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-600'
          )}>
            {status.is_active ? 'Activo' : 'Inactivo'}
          </span>
          <span className={cn(
            theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'
          )}>
            Orden: {status.order || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
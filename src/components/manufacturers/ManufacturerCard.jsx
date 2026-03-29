import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export default function ManufacturerCard({ manufacturer, onClick }) {
  const { theme } = useTheme();
  const [imgError, setImgError] = React.useState(false);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg group",
        theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800 hover:border-yellow-500/50' 
          : 'bg-white border-gray-200 hover:border-yellow-500/50'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className={cn(
            "w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
            theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'
          )}>
            {manufacturer.logo_url && !imgError ? (
              <img
                src={manufacturer.logo_url}
                alt={manufacturer.name}
                className="w-full h-full object-contain rounded-xl p-2"
                onError={() => setImgError(true)}
              />
            ) : (
              <Building2 className={cn(
                "w-10 h-10",
                theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'
              )} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg font-semibold truncate",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {manufacturer.name}
            </h3>
            {manufacturer.notes && (
              <p className={cn(
                "text-sm mt-1 line-clamp-2",
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              )}>
                {manufacturer.notes}
              </p>
            )}
            <p className={cn(
              "text-xs mt-2",
              theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
            )}>
              Creada: {new Date(manufacturer.created_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
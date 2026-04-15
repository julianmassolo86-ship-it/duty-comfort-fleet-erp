import React, { useContext } from "react";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package, AlertTriangle, History } from "lucide-react";

export default function SparePartCard({ sparePart, onEdit, onDelete, onViewHistory }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";

  if (!sparePart) return null;

  const isLowStock = sparePart.stock_quantity <= sparePart.minimum_stock && sparePart.minimum_stock > 0;
  const isOutOfStock = sparePart.stock_quantity === 0;

  const stockStatus = isOutOfStock
    ? { label: "Sin Stock", color: "bg-red-500/10 text-red-500 border-red-500/20" }
    : isLowStock
    ? { label: "Stock Bajo", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
    : { label: "En Stock", color: "bg-green-500/10 text-green-500 border-green-500/20" };

  return (
    <div className={cn(
      "rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn("p-2 rounded-lg shrink-0", isDark ? "bg-yellow-500/10" : "bg-yellow-50")}>
            <Package className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className={cn("font-semibold text-sm truncate", isDark ? "text-white" : "text-gray-900")}>
              {sparePart.name}
            </p>
            {sparePart.manufacturer && (
              <p className={cn("text-xs truncate", isDark ? "text-zinc-400" : "text-gray-500")}>
                {sparePart.manufacturer}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {onViewHistory && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewHistory(sparePart)} title="Ver historial">
              <History className={cn("w-3.5 h-3.5", isDark ? "text-zinc-400" : "text-gray-500")} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sparePart)}>
            <Pencil className={cn("w-3.5 h-3.5", isDark ? "text-zinc-400" : "text-gray-500")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(sparePart)}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Part Numbers */}
      {(sparePart.part_number || sparePart.alternative_part_number) && (
        <div className="flex flex-wrap gap-1.5">
          {sparePart.part_number && (
            <span className={cn("text-xs px-2 py-0.5 rounded font-mono", isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600")}>
              OEM: {sparePart.part_number}
            </span>
          )}
          {sparePart.alternative_part_number && (
            <span className={cn("text-xs px-2 py-0.5 rounded font-mono", isDark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-500")}>
              ALT: {sparePart.alternative_part_number}
            </span>
          )}
        </div>
      )}

      {sparePart.specifications && (
        <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>
          {sparePart.specifications}
        </p>
      )}

      {/* Stock Info */}
      <div className={cn("flex items-center justify-between pt-2 border-t", isDark ? "border-zinc-800" : "border-gray-100")}>
        <div className="flex items-center gap-3">
          {isLowStock && !isOutOfStock && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-lg font-bold", isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-500" : isDark ? "text-white" : "text-gray-900")}>
                {sparePart.stock_quantity ?? 0}
              </span>
              <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>
                stock
              </span>
            </div>
            {sparePart.quantity_per_unit && (
              <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>
                {sparePart.quantity_per_unit} {sparePart.unit_of_measure?.toLowerCase()} c/u
              </span>
            )}
            {!sparePart.quantity_per_unit && (
              <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>
                {sparePart.unit_of_measure}
              </span>
            )}
          </div>
        </div>
        <span className={cn("text-xs border px-2 py-0.5 rounded-full font-medium", stockStatus.color)}>
          {stockStatus.label}
        </span>
      </div>
    </div>
  );
}
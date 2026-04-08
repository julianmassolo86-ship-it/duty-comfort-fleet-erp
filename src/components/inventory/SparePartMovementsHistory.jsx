import React, { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw, RotateCcw, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG = {
  entrada: { label: "Entrada", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  egreso: { label: "Egreso", icon: TrendingDown, color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ajuste: { label: "Ajuste", icon: RefreshCw, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  devolucion: { label: "Devolución", icon: RotateCcw, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const ORIGIN_LABELS = {
  remito_compra: "Remito de Compra",
  orden_trabajo: "Orden de Trabajo",
  ajuste_manual: "Ajuste Manual",
  devolucion: "Devolución",
};

export default function SparePartMovementsHistory({ sparePartId }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements-part", sparePartId],
    queryFn: () => base44.entities.StockMovement.filter({ spare_part_id: sparePartId }, "-date"),
    enabled: !!sparePartId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cn("h-12 rounded-lg animate-pulse", isDark ? "bg-zinc-800" : "bg-gray-100")} />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <ArrowUpDown className={cn("w-8 h-8", isDark ? "text-zinc-700" : "text-gray-300")} />
        <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>No hay movimientos registrados para este repuesto</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-zinc-800" : "border-gray-200")}>
        <table className="w-full">
          <thead>
            <tr className={cn("text-xs border-b", isDark ? "bg-zinc-900/50 text-zinc-500 border-zinc-800" : "bg-gray-50 text-gray-500 border-gray-200")}>
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-right px-3 py-2">Cantidad</th>
              <th className="text-left px-3 py-2 hidden sm:table-cell">Origen</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Referencia</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m, i) => {
              const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.ajuste;
              const Icon = cfg.icon;
              return (
                <tr key={m.id} className={cn("text-sm border-b last:border-0", isDark ? "border-zinc-800/50 hover:bg-zinc-900/50" : "border-gray-100 hover:bg-gray-50")}>
                  <td className={cn("px-3 py-2.5 text-xs", isDark ? "text-zinc-400" : "text-gray-600")}>
                    {m.date ? format(new Date(m.date), "dd/MM/yy") : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={cn("text-xs border flex items-center gap-1 w-fit", cfg.color)}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-bold text-sm", m.type === "egreso" ? "text-red-400" : "text-emerald-400")}>
                    {m.type === "egreso" ? "-" : "+"}{m.quantity}
                  </td>
                  <td className={cn("px-3 py-2.5 text-xs hidden sm:table-cell", isDark ? "text-zinc-500" : "text-gray-500")}>
                    {ORIGIN_LABELS[m.origin] || m.origin || "-"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-xs hidden md:table-cell", isDark ? "text-zinc-500" : "text-gray-500")}>
                    {m.reference_number || "-"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-xs hidden md:table-cell", isDark ? "text-zinc-600" : "text-gray-400")}>
                    {m.user_name || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
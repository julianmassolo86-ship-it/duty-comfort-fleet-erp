import React, { useContext } from "react";
import { ThemeContextValue } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Car } from "lucide-react";

const STATUS_CONFIG = [
  { key: "active",      label: "Operativos",       color: "#22c55e", bg: "bg-green-500" },
  { key: "available",   label: "Disponibles",       color: "#3b82f6", bg: "bg-blue-500" },
  { key: "in_use",      label: "En servicio",       color: "#a855f7", bg: "bg-purple-500" },
  { key: "maintenance", label: "En mantenimiento",  color: "#eab308", bg: "bg-yellow-500" },
  { key: "reserved",    label: "Reservados",        color: "#f97316", bg: "bg-orange-500" },
  { key: "in_transit",  label: "En tránsito",       color: "#06b6d4", bg: "bg-cyan-500" },
  { key: "retired",     label: "Fuera de servicio", color: "#ef4444", bg: "bg-red-500" },
];

export default function FleetStatusBar({ vehicles = [] }) {
  const { theme } = useContext(ThemeContextValue);
  const isDark = theme === "dark";
  const total = vehicles.length;

  if (total === 0) return null;

  const counts = STATUS_CONFIG.map(s => ({
    ...s,
    count: vehicles.filter(v => v.status === s.key).length,
  })).filter(s => s.count > 0);

  return (
    <div className={cn(
      "rounded-2xl border p-5 backdrop-blur-xl shadow-2xl",
      isDark ? "bg-zinc-900/80 border-zinc-800/50 shadow-black/20" : "bg-white border-gray-200 shadow-gray-200/50"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={cn("p-2.5 rounded-xl", isDark ? "bg-yellow-500/10" : "bg-yellow-50")}>
          <Car className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className={cn("font-bold text-base", isDark ? "text-white" : "text-gray-900")}>
            Estado de Flota
          </h3>
          <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>
            {total} vehículos en total
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden h-3 mb-5 gap-0.5">
        {counts.map(s => (
          <div
            key={s.key}
            className={cn("transition-all", s.bg)}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>

      {/* Legend rows */}
      <div className="space-y-2.5">
        {counts.map(s => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div key={s.key} className="flex items-center gap-3">
              {/* Label + dot */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn("w-2 h-2 rounded-full shrink-0", s.bg)} />
                <span className={cn("text-sm truncate", isDark ? "text-zinc-300" : "text-gray-700")}>
                  {s.label}
                </span>
              </div>
              {/* Bar */}
              <div className="flex-1 max-w-[40%]">
                <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-zinc-800" : "bg-gray-100")}>
                  <div
                    className={cn("h-full rounded-full transition-all", s.bg)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {/* Pct + count */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-sm font-bold w-8 text-right", isDark ? "text-white" : "text-gray-900")}>
                  {pct}%
                </span>
                <span className={cn("text-xs w-10 text-right", isDark ? "text-zinc-500" : "text-gray-400")}>
                  ({s.count})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
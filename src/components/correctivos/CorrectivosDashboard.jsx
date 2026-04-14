import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { Wrench, CheckCircle2, Clock, DollarSign, Package, Timer } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const STATUS_CONFIG = {
  scheduled:   { label: "Programado",  color: "#eab308" },
  in_progress: { label: "En Progreso", color: "#3b82f6" },
  completed:   { label: "Completado",  color: "#22c55e" },
  cancelled:   { label: "Cancelado",   color: "#6b7280" },
};

function StatCard({ icon: Icon, label, value, color, isDark }) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 flex items-center gap-4",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
    )}>
      <div className="rounded-xl p-3" style={{ backgroundColor: color + "20" }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-gray-500")}>{label}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children, isDark }) {
  return (
    <h2 className={cn("text-sm font-bold uppercase tracking-wider mb-3", isDark ? "text-zinc-400" : "text-gray-500")}>
      {children}
    </h2>
  );
}

export default function CorrectivosDashboard({ correctivos, vehicles, spareParts }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const stats = useMemo(() => {
    const total = correctivos.length;
    const completed = correctivos.filter(c => c.status === "completed").length;
    const inProgress = correctivos.filter(c => c.status === "in_progress").length;

    const totalCost = correctivos.reduce((acc, c) => acc + (c.cost || 0), 0);

    // Por estado
    const byStatus = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: correctivos.filter(c => c.status === key).length,
      color: cfg.color,
    })).filter(e => e.value > 0);

    // Top vehículos
    const vehicleCount = {};
    correctivos.forEach(c => {
      if (c.vehicle_id) vehicleCount[c.vehicle_id] = (vehicleCount[c.vehicle_id] || 0) + 1;
    });
    const topVehicles = Object.entries(vehicleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => {
        const v = vehicles.find(v => v.id === id);
        return {
          name: v ? (v.internal_number ? `Int. ${v.internal_number}` : v.plate) : "Desconocido",
          count,
        };
      });

    // Repuestos más usados
    const partCount = {};
    correctivos.forEach(c => {
      (c.spare_parts_used || []).forEach(p => {
        if (p.spare_part_id) {
          if (!partCount[p.spare_part_id]) partCount[p.spare_part_id] = { name: p.spare_part_name || "Desconocido", qty: 0 };
          partCount[p.spare_part_id].qty += (p.quantity || 1);
        }
      });
    });
    const topParts = Object.values(partCount)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Tiempo promedio de resolución
    const withDates = correctivos.filter(c => c.scheduled_date && c.completed_date);
    const avgDays = withDates.length
      ? Math.round(withDates.reduce((acc, c) => {
          const diff = (new Date(c.completed_date) - new Date(c.scheduled_date)) / (1000 * 60 * 60 * 24);
          return acc + Math.abs(diff);
        }, 0) / withDates.length)
      : null;

    return { total, completed, inProgress, totalCost, byStatus, topVehicles, topParts, avgDays };
  }, [correctivos, vehicles, spareParts]);

  const tooltipStyle = {
    backgroundColor: isDark ? "#18181b" : "#fff",
    border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
    borderRadius: 8,
    color: isDark ? "#fff" : "#111",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Wrench}       label="Total Correctivos" value={stats.total}      color="#f97316" isDark={isDark} />
        <StatCard icon={Clock}        label="En Progreso"        value={stats.inProgress} color="#3b82f6" isDark={isDark} />
        <StatCard icon={CheckCircle2} label="Completados"        value={stats.completed}  color="#22c55e" isDark={isDark} />
        <StatCard icon={DollarSign}   label="Costo Total"        value={`$${stats.totalCost.toLocaleString()}`} color="#a855f7" isDark={isDark} />
      </div>

      {/* Tiempo promedio */}
      {stats.avgDays !== null && (
        <div className={cn("rounded-2xl border p-4 flex items-center gap-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <div className="rounded-xl p-3 bg-orange-500/20">
            <Timer className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">{stats.avgDays} días</p>
            <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-gray-500")}>Tiempo promedio de resolución</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Por Estado */}
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Por Estado</SectionTitle>
          {stats.byStatus.length === 0 ? (
            <p className={cn("text-sm text-center py-8", isDark ? "text-zinc-500" : "text-gray-400")}>Sin datos</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={stats.byStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {stats.byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.byStatus.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                      <span className={cn("text-xs", isDark ? "text-zinc-300" : "text-gray-700")}>{e.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: e.color }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Repuestos más usados */}
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Repuestos más utilizados</SectionTitle>
          {stats.topParts.length === 0 ? (
            <p className={cn("text-sm text-center py-8", isDark ? "text-zinc-500" : "text-gray-400")}>Sin datos de repuestos</p>
          ) : (
            <div className="space-y-2">
              {stats.topParts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="rounded-lg p-1.5 bg-orange-500/10">
                    <Package className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className={cn("text-xs flex-1 truncate", isDark ? "text-zinc-300" : "text-gray-700")}>{p.name}</span>
                  <span className="text-xs font-bold text-orange-400">{p.qty} unid.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top vehículos */}
      {stats.topVehicles.length > 0 && (
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Vehículos con más correctivos</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.topVehicles} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f3f4f6"} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Correctivos"]} />
              <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
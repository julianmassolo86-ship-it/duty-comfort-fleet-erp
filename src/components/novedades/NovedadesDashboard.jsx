import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { differenceInDays, parseISO } from "date-fns";
import {
  AlertTriangle, Clock, Wrench, CheckCircle2, XCircle,
  Car, TrendingUp, Timer
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

// ---- Config ----
const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "#eab308", Icon: Clock },
  en_proceso: { label: "En Proceso", color: "#3b82f6", Icon: Wrench },
  resuelto:   { label: "Resuelto",   color: "#22c55e", Icon: CheckCircle2 },
  cerrado:    { label: "Cerrado",    color: "#6b7280", Icon: XCircle },
};

const PRIORIDAD_CONFIG = {
  baja:    { label: "Baja",    color: "#3b82f6" },
  media:   { label: "Media",   color: "#eab308" },
  alta:    { label: "Alta",    color: "#f97316" },
  critica: { label: "Crítica", color: "#ef4444" },
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

export default function NovedadesDashboard({ novedades, vehicles }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const stats = useMemo(() => {
    const total = novedades.length;
    const pendientes = novedades.filter(n => n.estado === "pendiente").length;
    const en_proceso = novedades.filter(n => n.estado === "en_proceso").length;
    const resueltas = novedades.filter(n => n.estado === "resuelto").length;
    const criticas = novedades.filter(n => n.prioridad === "critica").length;

    // Tiempo promedio de resolución (días)
    const resueltas_con_fecha = novedades.filter(
      n => n.estado === "resuelto" && n.fecha_reporte && n.fecha_resolucion
    );
    const avgResolution = resueltas_con_fecha.length
      ? Math.round(
          resueltas_con_fecha.reduce((acc, n) => {
            return acc + differenceInDays(parseISO(n.fecha_resolucion), parseISO(n.fecha_reporte));
          }, 0) / resueltas_con_fecha.length
        )
      : null;

    // Por estado para pie chart
    const byEstado = Object.entries(ESTADO_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: novedades.filter(n => n.estado === key).length,
      color: cfg.color,
    })).filter(e => e.value > 0);

    // Por prioridad para pie chart
    const byPrioridad = Object.entries(PRIORIDAD_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: novedades.filter(n => n.prioridad === key).length,
      color: cfg.color,
    })).filter(e => e.value > 0);

    // Top vehículos con más novedades
    const vehicleCount = {};
    novedades.forEach(n => {
      if (n.vehicle_id) vehicleCount[n.vehicle_id] = (vehicleCount[n.vehicle_id] || 0) + 1;
    });
    const topVehicles = Object.entries(vehicleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const v = vehicles.find(v => v.id === id);
        return {
          name: v ? (v.internal_number ? `Int. ${v.internal_number}` : v.plate) : "Desconocido",
          plate: v?.plate || "-",
          count,
        };
      });

    return { total, pendientes, en_proceso, resueltas, criticas, avgResolution, byEstado, byPrioridad, topVehicles };
  }, [novedades, vehicles]);

  const tooltipStyle = {
    backgroundColor: isDark ? "#18181b" : "#fff",
    border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
    borderRadius: 8,
    color: isDark ? "#fff" : "#111",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={AlertTriangle} label="Total Novedades" value={stats.total}       color="#eab308" isDark={isDark} />
        <StatCard icon={Clock}        label="Pendientes"      value={stats.pendientes}   color="#eab308" isDark={isDark} />
        <StatCard icon={Wrench}       label="En Proceso"      value={stats.en_proceso}   color="#3b82f6" isDark={isDark} />
        <StatCard icon={CheckCircle2} label="Resueltas"       value={stats.resueltas}    color="#22c55e" isDark={isDark} />
        <StatCard icon={AlertTriangle} label="Críticas"       value={stats.criticas}     color="#ef4444" isDark={isDark} />
      </div>

      {/* Tiempo promedio */}
      {stats.avgResolution !== null && (
        <div className={cn(
          "rounded-2xl border p-4 flex items-center gap-4",
          isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
        )}>
          <div className="rounded-xl p-3 bg-purple-500/20">
            <Timer className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{stats.avgResolution} días</p>
            <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-gray-500")}>
              Tiempo promedio de resolución
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pie: Por estado */}
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Por Estado</SectionTitle>
          {stats.byEstado.length === 0 ? (
            <p className={cn("text-sm text-center py-8", isDark ? "text-zinc-500" : "text-gray-400")}>Sin datos</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={stats.byEstado} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {stats.byEstado.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.byEstado.map((e, i) => (
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

        {/* Pie: Por prioridad */}
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Por Prioridad</SectionTitle>
          {stats.byPrioridad.length === 0 ? (
            <p className={cn("text-sm text-center py-8", isDark ? "text-zinc-500" : "text-gray-400")}>Sin datos</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={stats.byPrioridad} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {stats.byPrioridad.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.byPrioridad.map((e, i) => (
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
      </div>

      {/* Top vehículos */}
      {stats.topVehicles.length > 0 && (
        <div className={cn("rounded-2xl border p-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200")}>
          <SectionTitle isDark={isDark}>Vehículos con más novedades</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.topVehicles} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f3f4f6"} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [v, "Novedades"]}
              />
              <Bar dataKey="count" fill="#eab308" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { Fuel, TrendingDown, DollarSign, Droplets, Car, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

const fuelTypeLabels = {
  gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico",
  gnc: "GNC", gnv: "GNV", biodiesel: "Biodiésel", ethanol: "Etanol", otro: "Otro",
};

function StatCard({ label, value, sub, icon: Icon, color = "yellow", theme }) {
  const colors = {
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    green:  { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
    blue:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
    red:    { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
  }[color];

  return (
    <div className={cn(
      "rounded-xl border p-4",
      theme === "dark" ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className={cn("text-xs font-medium", theme === "dark" ? "text-zinc-500" : "text-gray-500")}>{label}</p>
        <div className={cn("p-2 rounded-lg border", colors.bg, colors.border)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
      </div>
      <p className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>{value}</p>
      {sub && <p className={cn("text-xs mt-1", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>{sub}</p>}
    </div>
  );
}

// Calcula consumo (L/100km) y costo/km para un vehículo dado sus cargas ordenadas por km
function calcVehicleMetrics(vehicleFuels) {
  const sorted = [...vehicleFuels].filter(f => f.mileage).sort((a, b) => a.mileage - b.mileage);
  const fullTanks = sorted.filter(f => f.is_full_tank);

  let totalLitros = vehicleFuels.reduce((s, f) => s + (f.fuel_quantity || 0), 0);
  let totalCost = vehicleFuels.reduce((s, f) => s + (f.total_price || 0), 0);

  let consumption = null; // L/100km
  let costPerKm = null;

  if (fullTanks.length >= 2) {
    const last = fullTanks[fullTanks.length - 1];
    const prev = fullTanks[fullTanks.length - 2];
    const km = last.mileage - prev.mileage;
    const fuelBetween = sorted
      .filter(f => f.mileage > prev.mileage && f.mileage <= last.mileage)
      .reduce((s, f) => s + (f.fuel_quantity || 0), 0);
    const costBetween = sorted
      .filter(f => f.mileage > prev.mileage && f.mileage <= last.mileage)
      .reduce((s, f) => s + (f.total_price || 0), 0);

    if (km > 0 && fuelBetween > 0) consumption = (fuelBetween / km * 100);
    if (km > 0 && costBetween > 0) costPerKm = costBetween / km;
  }

  return { totalLitros, totalCost, consumption, costPerKm };
}

export default function FuelUpsDashboard({ fuelUps, vehicles }) {
  const { theme } = useTheme();

  const totalLitros = fuelUps.reduce((s, f) => s + (f.fuel_quantity || 0), 0);
  const totalCosto = fuelUps.reduce((s, f) => s + (f.total_price || 0), 0);
  const avgPricePerLiter = totalLitros > 0 ? totalCosto / totalLitros : 0;

  // Consumo global (promedio de vehículos con datos suficientes)
  const vehicleMetrics = useMemo(() => {
    return vehicles.map(v => {
      const vFuels = fuelUps.filter(f => f.vehicle_id === v.id);
      if (vFuels.length === 0) return null;
      const m = calcVehicleMetrics(vFuels);
      return { vehicle: v, ...m };
    }).filter(Boolean);
  }, [fuelUps, vehicles]);

  const withConsumption = vehicleMetrics.filter(m => m.consumption !== null);
  const avgConsumption = withConsumption.length > 0
    ? withConsumption.reduce((s, m) => s + m.consumption, 0) / withConsumption.length
    : null;

  const withCostPerKm = vehicleMetrics.filter(m => m.costPerKm !== null);
  const avgCostPerKm = withCostPerKm.length > 0
    ? withCostPerKm.reduce((s, m) => s + m.costPerKm, 0) / withCostPerKm.length
    : null;

  // Cargas por mes (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }), litros: 0, costo: 0, cargas: 0 };
    });
    fuelUps.forEach(f => {
      if (!f.date) return;
      const key = f.date.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) {
        m.litros += f.fuel_quantity || 0;
        m.costo += f.total_price || 0;
        m.cargas += 1;
      }
    });
    return months;
  }, [fuelUps]);

  // Top 5 vehículos por consumo total de litros
  const topVehiclesByLitros = useMemo(() => {
    return vehicleMetrics
      .sort((a, b) => b.totalLitros - a.totalLitros)
      .slice(0, 5)
      .map(m => ({
        name: m.vehicle.internal_number
          ? `Int. ${m.vehicle.internal_number}`
          : (m.vehicle.plate || "Sin datos"),
        litros: parseFloat(m.totalLitros.toFixed(1)),
        costo: parseFloat(m.totalCost.toFixed(0)),
        consumption: m.consumption ? parseFloat(m.consumption.toFixed(2)) : null,
        costPerKm: m.costPerKm ? parseFloat(m.costPerKm.toFixed(2)) : null,
      }));
  }, [vehicleMetrics]);

  const isDark = theme === "dark";
  const axisColor = isDark ? "#71717a" : "#9ca3af";
  const gridColor = isDark ? "#27272a" : "#f3f4f6";
  const tooltipBg = isDark ? "#18181b" : "#fff";
  const tooltipBorder = isDark ? "#3f3f46" : "#e5e7eb";

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cargas" value={fuelUps.length} sub={`${vehicles.length} vehículos`} icon={Fuel} color="yellow" theme={theme} />
        <StatCard label="Total Litros" value={`${totalLitros.toLocaleString("es-AR", { maximumFractionDigits: 0 })} L`} sub="todos los registros" icon={Droplets} color="blue" theme={theme} />
        <StatCard
          label="Costo Total"
          value={`$${totalCosto.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          sub={avgPricePerLiter > 0 ? `$${avgPricePerLiter.toFixed(2)}/L promedio` : undefined}
          icon={DollarSign}
          color="green"
          theme={theme}
        />
        <StatCard
          label="Consumo Promedio"
          value={avgConsumption ? `${avgConsumption.toFixed(1)} L/100km` : "—"}
          sub={avgCostPerKm ? `$${avgCostPerKm.toFixed(2)}/km` : "Necesita cargas llenas"}
          icon={TrendingDown}
          color={avgConsumption ? "yellow" : "red"}
          theme={theme}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Litros y costo por mes */}
        <div className={cn("rounded-xl border p-4", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
          <p className={cn("text-sm font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>Litros cargados por mes</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: isDark ? "#fff" : "#111" }} />
              <Bar dataKey="litros" fill="#eab308" radius={[4, 4, 0, 0]} name="Litros" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Costo por mes */}
        <div className={cn("rounded-xl border p-4", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
          <p className={cn("text-sm font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>Gasto en combustible por mes</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: isDark ? "#fff" : "#111" }}
                formatter={v => [`$${v.toLocaleString("es-AR")}`, "Costo"]}
              />
              <Line type="monotone" dataKey="costo" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e" }} name="Costo $" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de indicadores por vehículo */}
      {topVehiclesByLitros.length > 0 && (
        <div className={cn("rounded-xl border", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
          <div className={cn("flex items-center gap-2 px-4 py-3 border-b", isDark ? "border-zinc-800" : "border-gray-100")}>
            <BarChart2 className={cn("w-4 h-4", isDark ? "text-yellow-400" : "text-yellow-600")} />
            <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>Indicadores por Vehículo</p>
            <span className={cn("text-xs ml-auto", isDark ? "text-zinc-500" : "text-gray-400")}>Top {topVehiclesByLitros.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn(isDark ? "border-b border-zinc-800" : "border-b border-gray-100")}>
                  {["Vehículo", "Total Litros", "Costo Total", "Consumo (L/100km)", "Costo/km"].map(h => (
                    <th key={h} className={cn("px-4 py-2.5 text-left text-xs font-medium", isDark ? "text-zinc-500" : "text-gray-500")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topVehiclesByLitros.map((row, i) => (
                  <tr key={i} className={cn(i < topVehiclesByLitros.length - 1 ? (isDark ? "border-b border-zinc-800/50" : "border-b border-gray-50") : "")}>
                    <td className={cn("px-4 py-3 font-medium", isDark ? "text-white" : "text-gray-900")}>{row.name}</td>
                    <td className="px-4 py-3 text-yellow-500">{row.litros.toLocaleString("es-AR")} L</td>
                    <td className="px-4 py-3 text-green-500">${row.costo.toLocaleString("es-AR")}</td>
                    <td className={cn("px-4 py-3", isDark ? "text-zinc-300" : "text-gray-700")}>
                      {row.consumption != null ? `${row.consumption} L/100km` : <span className={isDark ? "text-zinc-600" : "text-gray-300"}>—</span>}
                    </td>
                    <td className={cn("px-4 py-3", isDark ? "text-zinc-300" : "text-gray-700")}>
                      {row.costPerKm != null ? `$${row.costPerKm}/km` : <span className={isDark ? "text-zinc-600" : "text-gray-300"}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={cn("text-xs px-4 py-2 border-t", isDark ? "text-zinc-600 border-zinc-800" : "text-gray-400 border-gray-100")}>
            Consumo y costo/km requieren al menos 2 cargas de "tanque lleno" con km registrado
          </p>
        </div>
      )}
    </div>
  );
}
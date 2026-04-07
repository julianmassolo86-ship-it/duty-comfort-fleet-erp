import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const COLORS = [
  '#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ef4444', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#a855f7', '#0ea5e9', '#d97706'
];

export default function VehiclesByLocationChart({ vehicles, locations, companies, vehicleTypes, isSuperAdmin }) {
  const { theme } = useTheme();
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');

  const filteredVehicles = useMemo(() => {
    if (!isSuperAdmin || selectedCompanyId === 'all') return vehicles;
    return vehicles.filter(v => v.company_id === selectedCompanyId);
  }, [vehicles, selectedCompanyId, isSuperAdmin]);

  const filteredLocations = useMemo(() => {
    if (!isSuperAdmin || selectedCompanyId === 'all') return locations;
    return locations.filter(l => l.company_id === selectedCompanyId);
  }, [locations, selectedCompanyId, isSuperAdmin]);

  const chartData = useMemo(() => {
    const locationMap = {};
    filteredVehicles.forEach(v => {
      const loc = filteredLocations.find(l => l.id === v.location_id);
      const locName = loc?.name || 'Sin locación';
      if (!locationMap[locName]) locationMap[locName] = { value: 0, vehicles: [] };
      locationMap[locName].value += 1;
      locationMap[locName].vehicles.push(v);
    });

    return Object.entries(locationMap)
      .map(([name, data], i) => ({ name, value: data.value, vehicles: data.vehicles, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredVehicles, filteredLocations]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = filteredVehicles.length;
      return (
        <div className={cn(
          "rounded-xl p-3 shadow-2xl border backdrop-blur-lg max-w-xs",
          theme === 'dark' ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-gray-200'
        )}>
          <p className={cn("font-semibold mb-1", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {data.name}
          </p>
          <p className={cn("text-sm mb-2", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
            {data.value} vehículo{data.value !== 1 ? 's' : ''} · {total > 0 ? ((data.value / total) * 100).toFixed(1) : 0}%
          </p>
          <div className={cn("border-t pt-2 space-y-1", theme === 'dark' ? 'border-zinc-700' : 'border-gray-200')}>
            {data.vehicles.map((v, i) => {
              const tipo = vehicleTypes?.find(t => t.id === v.type_id);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-mono px-1.5 py-0.5 rounded font-semibold",
                    theme === 'dark' ? 'bg-zinc-700 text-yellow-400' : 'bg-gray-100 text-yellow-600'
                  )}>
                    {v.internal_number || v.plate || '—'}
                  </span>
                  <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>
                    {tipo?.name || v.type_name || `${v.manufacturer} ${v.model}`.trim() || 'Sin tipo'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className={cn("text-xs font-medium", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
            {entry.value} ({entry.payload.value})
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Filtro por empresa - solo para super admin */}
      {isSuperAdmin && companies.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className={cn(
              "w-full sm:w-auto text-sm px-3 py-2 rounded-xl border outline-none transition-colors",
              theme === 'dark'
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-yellow-500/50'
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-yellow-400'
            )}
          >
            <option value="all">Todas las empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
            No hay datos disponibles
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={50}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
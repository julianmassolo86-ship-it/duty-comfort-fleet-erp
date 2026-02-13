import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const STATUS_COLORS = {
  active: '#10b981',
  available: '#3b82f6',
  in_use: '#8b5cf6',
  maintenance: '#eab308',
  reserved: '#f59e0b',
  in_transit: '#06b6d4',
  retired: '#6b7280'
};

const STATUS_LABELS = {
  active: 'Activo',
  available: 'Disponible',
  in_use: 'En Uso',
  maintenance: 'En Mantenimiento',
  reserved: 'Reservado',
  in_transit: 'En Tránsito',
  retired: 'Retirado'
};

export default function VehicleStatusPieChart({ vehicles }) {
  const { theme } = useTheme();

  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: vehicles.filter(v => v.status === key).length,
    color: STATUS_COLORS[key]
  })).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={cn(
          "rounded-xl p-3 shadow-2xl border backdrop-blur-lg",
          theme === 'dark' ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-gray-200'
        )}>
          <p className={cn("font-semibold mb-1", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {data.name}
          </p>
          <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
            {data.value} vehículo{data.value !== 1 ? 's' : ''}
          </p>
          <p className={cn("text-xs mt-1", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
            {((data.value / vehicles.length) * 100).toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className={cn("text-xs font-medium", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (statusData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
          No hay datos disponibles
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={90}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
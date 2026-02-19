import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const COMPANY_COLORS = [
  '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', 
  '#eab308', '#84cc16', '#10b981', '#f97316', '#ec4899', 
  '#14b8a6', '#6366f1', '#a855f7', '#22c55e', '#fb923c'
];

export default function VehiclesByCompanyChart({ vehicles, companies }) {
  const { theme } = useTheme();

  // Agrupar vehículos por empresa y contar
  const companyCounts = {};
  vehicles.forEach(vehicle => {
    if (vehicle.company_id) {
      companyCounts[vehicle.company_id] = (companyCounts[vehicle.company_id] || 0) + 1;
    }
  });

  // Crear datos para el gráfico
  const companyData = Object.entries(companyCounts).map(([companyId, count], index) => {
    const company = companies?.find(c => c.id === companyId);
    const companyName = company?.name || 'Sin empresa';
    
    return {
      name: companyName,
      value: count,
      color: COMPANY_COLORS[index % COMPANY_COLORS.length]
    };
  }).filter(item => item.value > 0);

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

  if (companyData.length === 0) {
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
          data={companyData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={90}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {companyData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
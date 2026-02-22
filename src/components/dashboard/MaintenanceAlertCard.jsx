import { Wrench, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const statusConfig = {
  overdue: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    icon: AlertTriangle,
    label: "Vencido"
  },
  due_soon: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: Clock,
    label: "Próximo"
  },
  on_track: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: Wrench,
    label: "Al día"
  },
};

export default function MaintenanceAlertCard({ vehiclePlate, vehicleModel, taskName, status, dueInfo }) {
  const { theme } = useTheme();
  const config = statusConfig[status] || statusConfig.on_track;
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-xl",
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group",
      config.bg,
      config.border,
      status === 'overdue' && "hover:shadow-rose-500/10",
      status === 'due_soon' && "hover:shadow-amber-500/10"
    )}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
      )} />
      
      <div className={cn(
        "relative p-3 rounded-xl shadow-lg backdrop-blur-sm border",
        config.bg,
        config.border,
        "group-hover:scale-110 transition-transform duration-300"
      )}>
        <Icon className={cn("w-5 h-5", config.text)} />
      </div>
      
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className={cn("font-semibold truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {taskName} - {vehiclePlate}
          </p>
          <span className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-lg border",
            theme === 'dark' ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50' : 'bg-gray-100 text-gray-600 border-gray-300'
          )}>
            Vehículo
          </span>
        </div>
        <p className={cn("text-sm truncate mb-2", theme === 'dark' ? 'text-zinc-500' : 'text-gray-600')}>
          {vehicleModel}
        </p>
        <p className={cn("text-xs font-semibold flex items-center gap-2", config.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", 
            status === 'overdue' ? 'bg-rose-400' : status === 'due_soon' ? 'bg-amber-400' : 'bg-blue-400',
            "animate-pulse"
          )} />
          {dueInfo}
        </p>
      </div>
    </div>
  );
}
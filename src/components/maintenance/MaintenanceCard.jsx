import { Wrench, ClipboardCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "../common/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeConfig = {
  preventive: { icon: Settings, label: "Preventivo", color: "text-blue-400" },
  corrective: { icon: Wrench, label: "Correctivo", color: "text-amber-400" },
  inspection: { icon: ClipboardCheck, label: "Inspección", color: "text-emerald-400" },
};

export default function MaintenanceCard({ maintenance, vehiclePlate, onClick }) {
  const config = typeConfig[maintenance.type] || typeConfig.preventive;
  const Icon = config.icon;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50",
        "p-6 cursor-pointer backdrop-blur-xl shadow-lg shadow-black/20",
        "hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-4 rounded-2xl bg-gradient-to-br border shadow-lg transition-all duration-500 group-hover:scale-110",
            maintenance.type === 'preventive' && "from-blue-500/10 to-blue-600/5 border-blue-500/10 text-blue-400 shadow-blue-500/5 group-hover:from-blue-500/20 group-hover:to-blue-600/10",
            maintenance.type === 'corrective' && "from-amber-500/10 to-amber-600/5 border-amber-500/10 text-amber-400 shadow-amber-500/5 group-hover:from-amber-500/20 group-hover:to-amber-600/10",
            maintenance.type === 'inspection' && "from-emerald-500/10 to-emerald-600/5 border-emerald-500/10 text-emerald-400 shadow-emerald-500/5 group-hover:from-emerald-500/20 group-hover:to-emerald-600/10"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className={cn("text-sm font-semibold", config.color)}>{config.label}</span>
            {vehiclePlate && (
              <p className="text-xl font-black text-white bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">{vehiclePlate}</p>
            )}
          </div>
        </div>
        <StatusBadge status={maintenance.status} />
      </div>
      
      <p className="relative text-zinc-400 mb-4 line-clamp-2 font-medium">{maintenance.description}</p>
      
      <div className="relative flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-xs text-zinc-500">Programada</span>
          <p className="text-sm font-semibold text-white">
            {maintenance.scheduled_date 
              ? format(new Date(maintenance.scheduled_date), "d MMM yyyy", { locale: es })
              : 'Sin fecha'}
          </p>
        </div>
        {maintenance.cost > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <span className="text-xs text-zinc-500">Costo</span>
            <p className="text-sm font-bold text-white">${maintenance.cost?.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
    </div>
  );
}
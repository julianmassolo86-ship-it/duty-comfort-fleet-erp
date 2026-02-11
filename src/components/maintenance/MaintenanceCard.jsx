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
        "group relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-5 cursor-pointer backdrop-blur-xl shadow-lg shadow-black/20",
        "transition-all duration-300 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl bg-slate-700/50", config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
            {vehiclePlate && (
              <p className="text-white font-semibold">{vehiclePlate}</p>
            )}
          </div>
        </div>
        <StatusBadge status={maintenance.status} />
      </div>
      
      <p className="text-slate-300 mb-4 line-clamp-2">{maintenance.description}</p>
      
      <div className="flex items-center justify-between text-sm border-t border-slate-700/50 pt-4">
        <div>
          <span className="text-slate-500">Fecha programada</span>
          <p className="text-slate-300">
            {maintenance.scheduled_date 
              ? format(new Date(maintenance.scheduled_date), "d MMM yyyy", { locale: es })
              : 'Sin fecha'}
          </p>
        </div>
        {maintenance.cost > 0 && (
          <div className="text-right">
            <span className="text-slate-500">Costo</span>
            <p className="text-slate-300 font-semibold">${maintenance.cost?.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
    </div>
  );
}
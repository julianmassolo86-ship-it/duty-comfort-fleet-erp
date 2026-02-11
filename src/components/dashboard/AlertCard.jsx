import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

const severityConfig = {
  critical: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: Clock,
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: CheckCircle2,
  },
};

export default function AlertCard({ title, description, date, severity = "warning", entityType }) {
  const config = severityConfig[severity];
  const Icon = config.icon;
  const daysUntil = date ? differenceInDays(new Date(date), new Date()) : null;

  return (
    <div className={cn(
      "relative flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-xl",
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group",
      config.bg,
      config.border,
      severity === 'critical' && "hover:shadow-rose-500/10",
      severity === 'warning' && "hover:shadow-amber-500/10"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      
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
          <p className="font-semibold text-white truncate">{title}</p>
          {entityType && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              {entityType === 'vehicle' ? 'Vehículo' : 'Conductor'}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 truncate mb-2">{description}</p>
        {date && (
          <p className={cn("text-xs font-semibold flex items-center gap-2", config.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", 
              severity === 'critical' ? 'bg-rose-400' : 'bg-amber-400',
              "animate-pulse"
            )} />
            {daysUntil !== null && daysUntil <= 0 
              ? "Vencido" 
              : `Vence en ${daysUntil} días`} 
            {' · '}{format(new Date(date), "d MMM yyyy", { locale: es })}
          </p>
        )}
      </div>
    </div>
  );
}
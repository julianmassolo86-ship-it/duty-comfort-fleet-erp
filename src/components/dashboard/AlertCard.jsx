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
      "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02]",
      config.bg,
      config.border
    )}>
      <div className={cn("p-2 rounded-lg", config.bg)}>
        <Icon className={cn("w-5 h-5", config.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white truncate">{title}</p>
          {entityType && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
              {entityType === 'vehicle' ? 'Vehículo' : 'Conductor'}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate">{description}</p>
        {date && (
          <p className={cn("text-xs mt-2", config.text)}>
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
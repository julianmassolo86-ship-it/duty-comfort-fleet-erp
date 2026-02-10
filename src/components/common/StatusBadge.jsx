import { cn } from "@/lib/utils";

const statusConfig = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Activo" },
  inactive: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Inactivo" },
  maintenance: { bg: "bg-amber-500/10", text: "text-amber-400", label: "En mantenimiento" },
  on_leave: { bg: "bg-blue-500/10", text: "text-blue-400", label: "De baja" },
  scheduled: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Programado" },
  in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", label: "En progreso" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completado" },
  cancelled: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Cancelado" },
  valid: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Vigente" },
  expiring_soon: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Por vencer" },
  expired: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Vencido" },
};

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
      config.bg,
      config.text,
      className
    )}>
      {config.label}
    </span>
  );
}
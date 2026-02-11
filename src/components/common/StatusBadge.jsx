import { cn } from "@/lib/utils";

const statusConfig = {
  active: { bg: "bg-emerald-500/90", text: "text-white", border: "border-emerald-400/50", label: "Activo" },
  inactive: { bg: "bg-slate-600/90", text: "text-white", border: "border-slate-400/50", label: "Inactivo" },
  maintenance: { bg: "bg-amber-500/90", text: "text-white", border: "border-amber-400/50", label: "En mantenimiento" },
  on_leave: { bg: "bg-blue-500/90", text: "text-white", border: "border-blue-400/50", label: "De baja" },
  scheduled: { bg: "bg-blue-500/90", text: "text-white", border: "border-blue-400/50", label: "Programado" },
  in_progress: { bg: "bg-amber-500/90", text: "text-white", border: "border-amber-400/50", label: "En progreso" },
  completed: { bg: "bg-emerald-500/90", text: "text-white", border: "border-emerald-400/50", label: "Completado" },
  cancelled: { bg: "bg-rose-500/90", text: "text-white", border: "border-rose-400/50", label: "Cancelado" },
  valid: { bg: "bg-emerald-500/90", text: "text-white", border: "border-emerald-400/50", label: "Vigente" },
  expiring_soon: { bg: "bg-amber-500/90", text: "text-white", border: "border-amber-400/50", label: "Por vencer" },
  expired: { bg: "bg-rose-500/90", text: "text-white", border: "border-rose-400/50", label: "Vencido" },
  available: { bg: "bg-blue-500/90", text: "text-white", border: "border-blue-400/50", label: "Disponible" },
  in_use: { bg: "bg-purple-500/90", text: "text-white", border: "border-purple-400/50", label: "En Uso" },
  reserved: { bg: "bg-cyan-500/90", text: "text-white", border: "border-cyan-400/50", label: "Reservado" },
  repair: { bg: "bg-orange-500/90", text: "text-white", border: "border-orange-400/50", label: "Reparación" },
};

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm shadow-lg",
      config.bg,
      config.text,
      config.border,
      className
    )}>
      {config.label}
    </span>
  );
}
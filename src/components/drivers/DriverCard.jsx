import { User, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "../common/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const licenseLabels = {
  A: "Tipo A - Motos",
  B: "Tipo B - Autos",
  C: "Tipo C - Camiones",
  D: "Tipo D - Buses",
  E: "Tipo E - Especial",
};

export default function DriverCard({ driver, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50",
        "p-5 cursor-pointer transition-all duration-300",
        "hover:bg-slate-800/70 hover:border-slate-600/50 hover:shadow-xl hover:shadow-yellow-500/5"
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {driver.photo_url ? (
            <img 
              src={driver.photo_url} 
              alt={driver.full_name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <User className="w-7 h-7 text-yellow-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white truncate">{driver.full_name}</h3>
            <StatusBadge status={driver.status} />
          </div>
          <p className="text-sm text-slate-400">{driver.employee_id || 'Sin ID de empleado'}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Phone className="w-4 h-4 text-slate-500" />
          <span>{driver.phone || 'Sin teléfono'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="truncate">{driver.email || 'Sin email'}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Licencia</span>
          <span className="text-slate-300">{licenseLabels[driver.license_type] || driver.license_type}</span>
        </div>
        {driver.license_expiry && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-500">Vence</span>
            <span className="text-slate-300">{format(new Date(driver.license_expiry), "d MMM yyyy", { locale: es })}</span>
          </div>
        )}
      </div>

      <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
    </div>
  );
}
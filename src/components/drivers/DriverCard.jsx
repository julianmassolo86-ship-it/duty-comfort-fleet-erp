import { User, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "../common/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTheme } from "../common/ThemeWrapper";

const licenseLabels = {
  A: "Tipo A - Motos",
  B: "Tipo B - Autos",
  C: "Tipo C - Camiones",
  D: "Tipo D - Buses",
  E: "Tipo E - Especial",
};

export default function DriverCard({ driver, onClick }) {
  const { theme } = useTheme();
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border",
        "p-6 cursor-pointer backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300",
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start gap-4 mb-4">
        {driver.photo_url ? (
          <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700">
            <img 
              src={driver.photo_url} 
              alt={driver.full_name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 text-yellow-400 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10 group-hover:border-yellow-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-yellow-500/5">
            <User className="w-8 h-8" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-black text-white truncate bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">{driver.full_name}</h3>
            <StatusBadge status={driver.status} />
          </div>
          <p className="text-sm text-zinc-600 font-medium">{driver.employee_id || 'Sin ID de empleado'}</p>
        </div>
      </div>
      
      <div className="relative space-y-2 mb-4">
        {driver.phone && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <Phone className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium text-white">{driver.phone}</span>
          </div>
        )}
        {driver.email && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <Mail className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-white truncate">{driver.email}</span>
          </div>
        )}
      </div>

      {driver.license_number && (
        <div className="relative flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-sm font-semibold text-white">{licenseLabels[driver.license_type] || driver.license_type}</span>
          {driver.license_expiry && (
            <span className="text-xs font-medium text-zinc-500">
              {format(new Date(driver.license_expiry), "dd/MM/yyyy")}
            </span>
          )}
        </div>
      )}

      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
    </div>
  );
}
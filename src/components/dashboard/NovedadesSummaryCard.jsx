import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, ArrowRight, Building2, MapPin, Car, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const PRIORIDAD_CONFIG = {
  baja: { label: "Baja", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  media: { label: "Media", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  alta: { label: "Alta", cls: "bg-orange-500/10 text-orange-400 border border-orange-500/20" },
  critica: { label: "Crítica", cls: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", cls: "bg-yellow-500/10 text-yellow-500" },
  en_proceso: { label: "En Proceso", cls: "bg-blue-500/10 text-blue-400" },
  resuelto: { label: "Resuelto", cls: "bg-green-500/10 text-green-400" },
  cerrado: { label: "Cerrado", cls: "bg-gray-500/10 text-gray-400" },
};

export default function NovedadesSummaryCard({ novedades = [], vehicles = [], locations = [], companies = [], vehicleTypes = [] }) {
  const { theme } = useTheme();

  const pendingNovedades = novedades.filter(n => n.estado === "pendiente" || n.estado === "en_proceso");
  const recentNovedades = pendingNovedades.slice(0, 6);

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getLocation = (id) => locations.find(l => l.id === id);
  const getCompany = (id) => companies.find(c => c.id === id);
  const getVehicleType = (id) => vehicleTypes.find(t => t.id === id);

  return (
    <div className={cn(
      "rounded-2xl border p-6 backdrop-blur-xl shadow-2xl",
      theme === "dark" ? "bg-zinc-900/80 border-zinc-800/50 shadow-black/20" : "bg-white border-gray-200 shadow-gray-200/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className={cn("text-lg font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
              Novedades Pendientes
            </h3>
            <p className={cn("text-sm", theme === "dark" ? "text-zinc-500" : "text-gray-500")}>
              {pendingNovedades.length} activas
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className={theme === "dark" ? "text-zinc-400 hover:text-white" : "text-gray-600"}>
          <Link to={createPageUrl("Novedades")}>
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {recentNovedades.length === 0 ? (
        <div className="text-center py-8">
          <p className={cn("text-sm", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
            No hay novedades pendientes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentNovedades.map((n) => {
            const vehicle = getVehicle(n.vehicle_id);
            const location = getLocation(n.location_id);
            const company = getCompany(n.company_id);
            const vehicleType = vehicle ? getVehicleType(vehicle.type_id) : null;
            const prioridad = PRIORIDAD_CONFIG[n.prioridad] || PRIORIDAD_CONFIG.media;
            const estado = ESTADO_CONFIG[n.estado] || ESTADO_CONFIG.pendiente;

            return (
              <Link
                key={n.id}
                to={createPageUrl("Novedades")}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-all block",
                  theme === "dark"
                    ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-600"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                {/* Foto del vehículo */}
                {vehicle && (
                  <div className="shrink-0">
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={vehicle.plate}
                        className="w-12 h-12 rounded-lg object-cover border"
                        style={{ borderColor: theme === "dark" ? "rgb(63,63,70)" : "rgb(229,231,235)" }}
                      />
                    ) : (
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center border",
                        theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200"
                      )}>
                        <Car className={cn("w-5 h-5", theme === "dark" ? "text-zinc-600" : "text-gray-400")} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Descripción y badges */}
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("font-medium text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>
                      {n.descripcion}
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                      {n.prioridad && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prioridad.cls)}>
                          {prioridad.label}
                        </span>
                      )}
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", estado.cls)}>
                        {estado.label}
                      </span>
                    </div>
                  </div>

                  {/* Info del vehículo */}
                  {vehicle && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      {vehicle.internal_number && (
                        <span className={cn("text-xs font-medium", theme === "dark" ? "text-zinc-300" : "text-gray-700")}>
                          Interno {vehicle.internal_number}
                        </span>
                      )}
                      <span className={cn("text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        {vehicle.manufacturer} {vehicle.model}
                      </span>
                      {vehicleType && (
                        <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                          {vehicleType.name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {company && (
                      <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        <Building2 className="w-3 h-3" /> {company.name}
                      </span>
                    )}
                    {location && (
                      <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        <MapPin className="w-3 h-3" /> {location.name}
                      </span>
                    )}
                    {n.kilometraje_reportado && (
                      <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                        {n.kilometraje_reportado.toLocaleString()} km
                      </span>
                    )}
                    <span className={cn("flex items-center gap-1 text-xs ml-auto", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                      <Clock className="w-3 h-3" />
                      {n.fecha_reporte ? format(new Date(n.fecha_reporte + "T00:00:00"), "dd/MM/yyyy") : "-"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
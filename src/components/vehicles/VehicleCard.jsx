import { Car, Truck, Bus, Bike, MapPin, Building2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../common/StatusBadge";
import { useTheme } from "../common/ThemeWrapper";

const vehicleIcons = {
  car: Car,
  truck: Truck,
  van: Truck,
  bus: Bus,
  motorcycle: Bike,
};

const fuelLabels = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
};

export default function VehicleCard({ vehicle, location, company, drivers = [], vehicleStatuses = [], onClick }) {
  const Icon = vehicleIcons[vehicle.type] || Car;
  const { theme } = useTheme();
  const [manufacturerLogo, setManufacturerLogo] = useState(vehicle.manufacturer_logo_url);
  
  // Obtener el logo actual del fabricante
  useEffect(() => {
    if (vehicle.manufacturer) {
      base44.entities.Manufacturer.filter({ name: vehicle.manufacturer })
        .then(results => {
          if (results.length > 0 && results[0].logo_url) {
            setManufacturerLogo(results[0].logo_url);
          }
        })
        .catch(() => {});
    }
  }, [vehicle.manufacturer]);
  
  // Obtener conductores asignados
  const driverIds = vehicle.assigned_driver_ids || (vehicle.assigned_driver_id ? [vehicle.assigned_driver_id] : []);
  const assignedDrivers = drivers.filter(d => driverIds.includes(d.id));

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border",
        "p-0 cursor-pointer backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300",
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Imagen o icono del vehículo - Ancho completo */} 
      <div className="relative w-full h-40 overflow-hidden">
        {vehicle.image_url ? (
          <img src={vehicle.image_url} alt={vehicle.plate} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
            <Icon className="w-16 h-16" />
          </div>
        )}
        <StatusBadge status={vehicle.status} statusList={vehicleStatuses} className="absolute top-3 right-3" />
        
        {/* Logo de la marca superpuesto en la imagen */}
        {vehicle.manufacturer_logo_url && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <img 
              src={vehicle.manufacturer_logo_url} 
              alt={vehicle.manufacturer} 
              className="h-8 w-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-6 relative">
        {/* Número interno y patente */}
        <div className="relative mb-3 flex items-baseline justify-between gap-4">
          <div className="flex-shrink-0">
            {vehicle.internal_number && (
              <span className="text-3xl font-black bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">#{vehicle.internal_number}</span>
            )}
          </div>
          <div className="flex-shrink-0">
            <h3 className="text-xl font-black text-white bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">{vehicle.plate}</h3>
          </div>
        </div>

        {/* Marca y modelo */}
        <div className="relative mb-4">
          <p className={cn("font-semibold text-lg", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>{vehicle.manufacturer} {vehicle.model}</p>
        </div>

        {(location || company) && (
          <div className="relative space-y-2 mb-4">
            {location && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-white truncate">{location.name}</span>
              </div>
            )}
            {company && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-white truncate">{company.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Conductores Asignados */}
        {assignedDrivers.length > 0 && (
          <div className="relative mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <User className="w-4 h-4 text-blue-500" />
              <div className="flex-1 min-w-0">
                {assignedDrivers.length === 1 ? (
                  <span className="text-sm font-medium text-white truncate block">{assignedDrivers[0].full_name}</span>
                ) : (
                  <span className="text-sm font-medium text-white truncate block">
                    {assignedDrivers.map(d => d.full_name).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="relative flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
            <span className="text-xs font-semibold text-zinc-400">{vehicle.year}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
            <span className="text-xs font-semibold text-zinc-400">{fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
          </div>
          {vehicle.mileage && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
              <span className="text-xs font-semibold text-zinc-400">{vehicle.mileage?.toLocaleString()} km</span>
            </div>
          )}
        </div>

        <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
      </div>
    </div>
  );
}
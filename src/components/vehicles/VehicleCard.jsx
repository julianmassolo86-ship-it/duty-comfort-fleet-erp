import { Car, Truck, Bus, Bike, MapPin, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "../common/StatusBadge";

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

export default function VehicleCard({ vehicle, location, company, drivers = [], onClick }) {
  const Icon = vehicleIcons[vehicle.type] || Car;
  
  // Obtener conductores asignados
  const driverIds = vehicle.assigned_driver_ids || (vehicle.assigned_driver_id ? [vehicle.assigned_driver_id] : []);
  const assignedDrivers = drivers.filter(d => driverIds.includes(d.id));

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50",
        "p-0 cursor-pointer backdrop-blur-xl shadow-lg shadow-black/20",
        "hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300"
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
        <StatusBadge status={vehicle.status} className="absolute top-3 right-3" />
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-6 relative">
        <div className="relative mb-4">
          <h3 className="text-2xl font-black text-white mb-1 bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">{vehicle.plate}</h3>
          <p className="text-zinc-500 font-semibold text-base">{vehicle.brand} {vehicle.model}</p>
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
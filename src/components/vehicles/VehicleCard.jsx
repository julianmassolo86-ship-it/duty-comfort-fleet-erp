import { Car, Truck, Bus, Bike, MapPin, Building2 } from "lucide-react";
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

export default function VehicleCard({ vehicle, location, company, onClick }) {
  const Icon = vehicleIcons[vehicle.type] || Car;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50",
        "p-6 cursor-pointer backdrop-blur-xl shadow-lg shadow-black/20",
        "hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {vehicle.image_url ? (
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700">
              <img src={vehicle.image_url} alt={vehicle.plate} className="w-12 h-12 rounded-lg object-cover" />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 text-blue-400 group-hover:from-blue-500/20 group-hover:to-blue-600/10 group-hover:border-blue-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-blue-500/5">
              <Icon className="w-7 h-7" />
            </div>
          )}
        </div>
        <StatusBadge status={vehicle.status} />
      </div>
      
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
  );
}
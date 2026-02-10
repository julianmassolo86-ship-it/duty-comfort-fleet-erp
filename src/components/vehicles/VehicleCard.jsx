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
        "group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50",
        "p-5 cursor-pointer transition-all duration-300",
        "hover:bg-slate-800/70 hover:border-slate-600/50 hover:shadow-xl hover:shadow-blue-500/5"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        {vehicle.image_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-500/20">
            <img src={vehicle.image_url} alt={vehicle.plate} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <StatusBadge status={vehicle.status} />
      </div>
      
      <div className="space-y-1 mb-3">
        <h3 className="text-lg font-semibold text-white">{vehicle.plate}</h3>
        <p className="text-slate-400">{vehicle.brand} {vehicle.model}</p>
      </div>

      {(location || company) && (
        <div className="flex flex-col gap-1 mb-3 text-xs">
          {location && (
            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>{location.name}</span>
            </div>
          )}
          {company && (
            <div className="flex items-center gap-1 text-slate-500">
              <Building2 className="w-3 h-3" />
              <span>{company.name}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>{vehicle.year}</span>
        <span>·</span>
        <span>{fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
        {vehicle.mileage && (
          <>
            <span>·</span>
            <span>{vehicle.mileage?.toLocaleString()} km</span>
          </>
        )}
      </div>

      <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
    </div>
  );
}
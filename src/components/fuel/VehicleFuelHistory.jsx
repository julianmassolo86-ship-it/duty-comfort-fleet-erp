import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Fuel, Droplets, Receipt, Trash2, Pencil, CheckCircle, DollarSign, TrendingDown } from "lucide-react";
import FuelUpDialog from "./FuelUpDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";

const fuelTypeLabels = {
  gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico",
  gnc: "GNC", gnv: "GNV", biodiesel: "Biodiésel", ethanol: "Etanol", otro: "Otro",
};

export default function VehicleFuelHistory({ vehicleId, companyId, locationId, vehicle }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuelUp, setEditingFuelUp] = useState(null);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: fuelUps = [], isLoading } = useQuery({
    queryKey: ["fuelUps", vehicleId],
    queryFn: () => base44.entities.FuelUp.filter({ vehicle_id: vehicleId }, "-date"),
    enabled: !!vehicleId,
  });

  const handleDelete = async (id) => {
    await base44.entities.FuelUp.delete(id);
    queryClient.invalidateQueries({ queryKey: ["fuelUps", vehicleId] });
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["fuelUps", vehicleId] });
  };

  const totalSpent = fuelUps.reduce((sum, f) => sum + (f.total_price || 0), 0);
  const totalLiters = fuelUps.reduce((sum, f) => sum + (f.fuel_quantity || 0), 0);
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : null;

  // Calcular consumo y costo/km entre las 2 últimas cargas de tanque lleno con km
  const calcMetrics = () => {
    const fullTanks = fuelUps.filter(f => f.is_full_tank && f.mileage).sort((a, b) => a.mileage - b.mileage);
    if (fullTanks.length < 2) return { consumption: null, costPerKm: null };
    const last = fullTanks[fullTanks.length - 1];
    const prev = fullTanks[fullTanks.length - 2];
    const km = last.mileage - prev.mileage;
    const fuelsInRange = fuelUps.filter(f => f.mileage > prev.mileage && f.mileage <= last.mileage);
    const fuelBetween = fuelsInRange.reduce((s, f) => s + (f.fuel_quantity || 0), 0);
    const costBetween = fuelsInRange.reduce((s, f) => s + (f.total_price || 0), 0);
    if (km <= 0 || fuelBetween <= 0) return { consumption: null, costPerKm: null };
    return {
      consumption: (fuelBetween / km * 100).toFixed(2),
      costPerKm: costBetween > 0 ? (costBetween / km).toFixed(2) : null,
      km,
    };
  };

  const { consumption, costPerKm, km: kmRange } = calcMetrics();

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={cn("p-3 rounded-lg border text-center", isDark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200")}>
          <p className={cn("text-xs mb-1", isDark ? "text-zinc-500" : "text-gray-500")}>Cargas</p>
          <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{fuelUps.length}</p>
        </div>
        <div className={cn("p-3 rounded-lg border text-center", isDark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200")}>
          <p className={cn("text-xs mb-1", isDark ? "text-zinc-500" : "text-gray-500")}>Total Litros</p>
          <p className="text-xl font-bold text-yellow-500">{totalLiters.toFixed(1)} L</p>
          {avgPricePerLiter && <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-600" : "text-gray-400")}>${avgPricePerLiter.toFixed(2)}/L</p>}
        </div>
        <div className={cn("p-3 rounded-lg border text-center", isDark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200")}>
          <p className={cn("text-xs mb-1", isDark ? "text-zinc-500" : "text-gray-500")}>Total Gastado</p>
          <p className="text-xl font-bold text-green-500">${totalSpent.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
        </div>
        <div className={cn("p-3 rounded-lg border text-center", isDark ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200")}>
          <p className={cn("text-xs mb-1", isDark ? "text-zinc-500" : "text-gray-500")}>Consumo</p>
          {consumption
            ? <p className="text-xl font-bold text-blue-400">{consumption} <span className="text-sm font-normal">L/100km</span></p>
            : <p className={cn("text-sm font-medium mt-1", isDark ? "text-zinc-600" : "text-gray-400")}>—</p>
          }
        </div>
      </div>

      {/* Indicadores clave */}
      {(consumption || costPerKm) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {consumption && (
            <div className={cn("p-3 rounded-lg border flex items-center gap-3", isDark ? "bg-yellow-500/5 border-yellow-500/20" : "bg-yellow-50 border-yellow-200")}>
              <Droplets className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className={cn("text-xs font-medium", isDark ? "text-yellow-400" : "text-yellow-700")}>Consumo estimado</p>
                <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{consumption} L/100km</p>
                {kmRange && <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>últimos {kmRange.toLocaleString()} km</p>}
              </div>
            </div>
          )}
          {costPerKm && (
            <div className={cn("p-3 rounded-lg border flex items-center gap-3", isDark ? "bg-green-500/5 border-green-500/20" : "bg-green-50 border-green-200")}>
              <DollarSign className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className={cn("text-xs font-medium", isDark ? "text-green-400" : "text-green-700")}>Costo por km</p>
                <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>${costPerKm}/km</p>
                {avgPricePerLiter && <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>${avgPricePerLiter.toFixed(2)}/L promedio</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {!consumption && fuelUps.length > 0 && (
        <p className={cn("text-xs px-3 py-2 rounded-lg border", isDark ? "text-zinc-500 border-zinc-800 bg-zinc-900/50" : "text-gray-400 border-gray-200 bg-gray-50")}>
          Para calcular consumo y costo/km se necesitan al menos 2 cargas marcadas como "tanque lleno" con km registrado
        </p>
      )}

      <div className="flex justify-between items-center">
        <h3 className={cn("text-sm font-medium", isDark ? "text-zinc-400" : "text-gray-600")}>Historial de Cargas</h3>
        <Button size="sm" onClick={() => { setEditingFuelUp(null); setDialogOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-1" /> Nueva Carga
        </Button>
      </div>

      {isLoading ? (
        <div className={cn("p-8 text-center text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>Cargando...</div>
      ) : fuelUps.length === 0 ? (
        <div className={cn("p-8 text-center border-2 border-dashed rounded-xl", isDark ? "border-zinc-800" : "border-gray-200")}>
          <Fuel className={cn("w-10 h-10 mx-auto mb-2", isDark ? "text-zinc-700" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>Sin cargas de combustible registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fuelUps.map(f => (
            <div key={f.id} className={cn("p-3 rounded-lg border flex items-start justify-between gap-3", isDark ? "border-zinc-800 bg-zinc-900/50" : "border-gray-200 bg-gray-50")}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("p-2 rounded-lg flex-shrink-0", isDark ? "bg-zinc-800" : "bg-white border border-gray-200")}>
                  <Fuel className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{f.date}</span>
                    {f.is_full_tank && (
                      <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Tanque Lleno
                      </span>
                    )}
                    <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{fuelTypeLabels[f.fuel_type] || f.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-yellow-500">{f.fuel_quantity}L</span>
                    <span className="text-xs text-green-500">${f.total_price?.toLocaleString("es-AR")}</span>
                    {f.price_per_unit && <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>${f.price_per_unit}/L</span>}
                    {f.mileage && <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{f.mileage.toLocaleString()} km</span>}
                    {f.hours && <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{f.hours} hs</span>}
                  </div>
                  {f.notes && <p className={cn("text-xs mt-1 truncate", isDark ? "text-zinc-600" : "text-gray-400")}>{f.notes}</p>}
                </div>
                {f.ticket_photo_url && (
                  <a href={f.ticket_photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <Receipt className={cn("w-4 h-4 transition-colors", isDark ? "text-zinc-500 hover:text-yellow-400" : "text-gray-400 hover:text-yellow-500")} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" className={cn("h-7 w-7", isDark ? "text-zinc-500 hover:text-yellow-400" : "text-gray-400 hover:text-yellow-500")} onClick={() => { setEditingFuelUp(f); setDialogOpen(true); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className={cn("h-7 w-7", isDark ? "text-zinc-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className={cn(isDark ? "bg-zinc-950 border-zinc-800" : "bg-white")}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar carga?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(f.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <FuelUpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicleId={vehicleId}
        companyId={companyId}
        locationId={locationId}
        vehicle={vehicle}
        fuelUp={editingFuelUp}
        onSaved={handleSaved}
      />
    </div>
  );
}
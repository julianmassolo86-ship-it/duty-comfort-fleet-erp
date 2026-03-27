import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Fuel, Droplets, Receipt, Trash2, Pencil, CheckCircle } from "lucide-react";
import FuelUpDialog from "./FuelUpDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const fuelTypeLabels = {
  gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico",
  gnc: "GNC", gnv: "GNV", biodiesel: "Biodiésel", ethanol: "Etanol", otro: "Otro",
};

export default function VehicleFuelHistory({ vehicleId, companyId, locationId, vehicle }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuelUp, setEditingFuelUp] = useState(null);
  const queryClient = useQueryClient();

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

  // Calcular consumo entre cargas de tanque lleno
  const calculateConsumption = () => {
    const fullTanks = fuelUps.filter(f => f.is_full_tank && f.mileage).sort((a, b) => a.mileage - b.mileage);
    if (fullTanks.length < 2) return null;
    const last = fullTanks[fullTanks.length - 1];
    const prev = fullTanks[fullTanks.length - 2];
    const kmDiff = last.mileage - prev.mileage;
    // Suma del combustible entre las dos últimas cargas llenas
    const fuelBetween = fuelUps
      .filter(f => f.mileage >= prev.mileage && f.mileage <= last.mileage && f.id !== prev.id)
      .reduce((sum, f) => sum + (f.fuel_quantity || 0), 0);
    if (kmDiff <= 0 || fuelBetween <= 0) return null;
    return (fuelBetween / kmDiff * 100).toFixed(2);
  };

  const consumption = calculateConsumption();
  const totalSpent = fuelUps.reduce((sum, f) => sum + (f.total_price || 0), 0);
  const totalLiters = fuelUps.reduce((sum, f) => sum + (f.fuel_quantity || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 mb-1">Cargas</p>
          <p className="text-xl font-bold text-white">{fuelUps.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 mb-1">Total Litros</p>
          <p className="text-xl font-bold text-yellow-400">{totalLiters.toFixed(1)}L</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 mb-1">Total Gastado</p>
          <p className="text-xl font-bold text-green-400">${totalSpent.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {consumption && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
          <Droplets className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Consumo promedio estimado</p>
            <p className="text-xs text-zinc-400">{consumption} L/100km (últimas 2 cargas de tanque lleno)</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-zinc-400">Historial de Cargas</h3>
        <Button size="sm" onClick={() => { setEditingFuelUp(null); setDialogOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-1" /> Nueva Carga
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-zinc-500 text-sm">Cargando...</div>
      ) : fuelUps.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl">
          <Fuel className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Sin cargas de combustible registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fuelUps.map(f => (
            <div key={f.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-zinc-800 flex-shrink-0">
                  <Fuel className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{f.date}</span>
                    {f.is_full_tank && (
                      <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Tanque Lleno
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">{fuelTypeLabels[f.fuel_type] || f.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-yellow-400">{f.fuel_quantity}L</span>
                    <span className="text-xs text-green-400">${f.total_price?.toLocaleString("es-AR")}</span>
                    {f.mileage && <span className="text-xs text-zinc-500">{f.mileage.toLocaleString()} km</span>}
                    {f.hours && <span className="text-xs text-zinc-500">{f.hours} hs</span>}
                  </div>
                  {f.notes && <p className="text-xs text-zinc-600 mt-1 truncate">{f.notes}</p>}
                </div>
                {f.ticket_photo_url && (
                  <a href={f.ticket_photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <Receipt className="w-4 h-4 text-zinc-500 hover:text-yellow-400 transition-colors" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-500 hover:text-yellow-400" onClick={() => { setEditingFuelUp(f); setDialogOpen(true); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-500 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Eliminar carga?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
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
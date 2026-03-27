import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Fuel, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/common/PageHeader";
import PageWrapper from "../components/common/PageWrapper";
import EmptyState from "../components/common/EmptyState";
import FuelUpDialog from "../components/fuel/FuelUpDialog";
import MobileSelect from "../components/common/MobileSelect";
import { useTheme } from "../components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Fuel as FuelIcon, CheckCircle, Receipt } from "lucide-react";

const fuelTypeLabels = {
  gasoline: "Gasolina", diesel: "Diésel", electric: "Eléctrico",
  gnc: "GNC", gnv: "GNV", biodiesel: "Biodiésel", ethanol: "Etanol", otro: "Otro",
};

export default function FuelUps() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuelUp, setEditingFuelUp] = useState(null);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", currentUser?.company_id],
    queryFn: async () => {
      const all = await base44.entities.Vehicle.list();
      return currentUser?.company_id ? all.filter(v => v.company_id === currentUser.company_id) : all;
    },
    enabled: !!currentUser,
  });

  const { data: fuelUps = [], isLoading } = useQuery({
    queryKey: ["fuelUps", "all", currentUser?.company_id],
    queryFn: async () => {
      const all = await base44.entities.FuelUp.list("-date");
      return currentUser?.company_id ? all.filter(f => f.company_id === currentUser.company_id) : all;
    },
    enabled: !!currentUser,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", currentUser?.company_id],
    queryFn: async () => {
      const all = await base44.entities.Location.list();
      return currentUser?.company_id ? all.filter(l => l.company_id === currentUser.company_id) : all;
    },
    enabled: !!currentUser,
  });

  const vehiclesMap = vehicles.reduce((acc, v) => ({ ...acc, [v.id]: v }), {});

  const filtered = fuelUps.filter(f => {
    const vehicle = vehiclesMap[f.vehicle_id];
    const matchesVehicle = vehicleFilter === "all" || f.vehicle_id === vehicleFilter;
    const searchTerm = search.toLowerCase();
    const matchesSearch = !searchTerm ||
      vehicle?.plate?.toLowerCase().includes(searchTerm) ||
      vehicle?.internal_number?.toLowerCase().includes(searchTerm) ||
      f.date?.includes(searchTerm);
    return matchesVehicle && matchesSearch;
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["fuelUps"] });
  };

  const handleNew = () => {
    setEditingFuelUp(null);
    setDialogOpen(true);
  };

  return (
    <PageWrapper onRefresh={() => queryClient.invalidateQueries({ queryKey: ["fuelUps"] })}>
      <PageHeader
        title="Cargas de Combustible"
        description="Registra y controla las cargas de combustible de tu flota"
        actions={
          <Button onClick={handleNew} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nueva Carga
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
          <Input
            placeholder="Buscar por patente, interno o fecha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn("pl-10", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300')}
          />
        </div>
        <MobileSelect
          value={vehicleFilter}
          onValueChange={setVehicleFilter}
          placeholder="Vehículo"
          options={[{ value: "all", label: "Todos los vehículos" }, ...vehicles.map(v => ({ value: v.id, label: `${v.internal_number || ''} ${v.plate || ''} - ${v.manufacturer} ${v.model}`.trim() }))]}
          triggerClassName={cn("w-full sm:w-60", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300')}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="Sin cargas registradas"
          description="Registra la primera carga de combustible"
          action={<Button onClick={handleNew} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"><Plus className="w-4 h-4 mr-2" />Nueva Carga</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const vehicle = vehiclesMap[f.vehicle_id];
            return (
              <div
                key={f.id}
                onClick={() => { setEditingFuelUp(f); setDialogOpen(true); }}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  theme === 'dark'
                    ? 'bg-zinc-900/50 border-zinc-800 hover:border-yellow-500/30'
                    : 'bg-white border-gray-200 hover:border-yellow-400'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100')}>
                      <FuelIcon className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("font-semibold text-sm", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          {vehicle ? `${vehicle.internal_number || ''} ${vehicle.plate || ''} - ${vehicle.manufacturer} ${vehicle.model}`.trim() : "Vehículo no encontrado"}
                        </span>
                        {f.is_full_tank && (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Tanque Lleno
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-400' : 'text-gray-500')}>{f.date}</span>
                        <span className="text-xs text-yellow-500 font-medium">{f.fuel_quantity}L</span>
                        <span className="text-xs text-green-500 font-medium">${f.total_price?.toLocaleString("es-AR")}</span>
                        {f.mileage && <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>{f.mileage.toLocaleString()} km</span>}
                        {f.hours && <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')}>{f.hours} hs</span>}
                        <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-600' : 'text-gray-400')}>{fuelTypeLabels[f.fuel_type] || f.fuel_type}</span>
                      </div>
                    </div>
                  </div>
                  {f.ticket_photo_url && (
                    <a href={f.ticket_photo_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <Receipt className="w-4 h-4 text-zinc-500 hover:text-yellow-400 transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <FuelUpDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vehicleId={editingFuelUp?.vehicle_id || (vehicleFilter !== "all" ? vehicleFilter : vehicles[0]?.id)}
          companyId={editingFuelUp?.company_id || currentUser?.company_id || vehicles[0]?.company_id}
          locationId={editingFuelUp?.location_id || vehicles[0]?.location_id}
          vehicle={editingFuelUp ? vehiclesMap[editingFuelUp.vehicle_id] : null}
          fuelUp={editingFuelUp}
          onSaved={handleSaved}
          vehicles={vehicles}
          showVehicleSelector={!editingFuelUp}
        />
      )}
    </PageWrapper>
  );
}
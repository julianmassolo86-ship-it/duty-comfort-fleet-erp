import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import MaintenanceCard from "../components/maintenance/MaintenanceCard";
import MaintenanceDialog from "../components/maintenance/MaintenanceDialog";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Maintenance() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances', currentUser?.company_id],
    queryFn: async () => {
      const allMaintenances = await base44.entities.Maintenance.list('-scheduled_date');
      if (currentUser?.company_id) {
        return allMaintenances.filter(m => m.company_id === currentUser.company_id);
      }
      return allMaintenances;
    },
    enabled: !!currentUser,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', currentUser?.company_id],
    queryFn: async () => {
      const allVehicles = await base44.entities.Vehicle.list();
      if (currentUser?.company_id) {
        return allVehicles.filter(v => v.company_id === currentUser.company_id);
      }
      return allVehicles;
    },
    enabled: !!currentUser,
  });

  const vehiclesMap = vehicles.reduce((acc, v) => ({ ...acc, [v.id]: v }), {});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Maintenance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
      setSelectedMaintenance(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Maintenance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
      setSelectedMaintenance(null);
    },
  });

  const handleSave = (data) => {
    // Si es admin de empresa, asignar su company_id automáticamente
    const finalData = isSuperAdmin ? data : { ...data, company_id: currentUser?.company_id };
    
    if (selectedMaintenance) {
      updateMutation.mutate({ id: selectedMaintenance.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleEdit = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setDialogOpen(true);
  };

  const filteredMaintenances = maintenances.filter(m => {
    const vehicle = vehiclesMap[m.vehicle_id];
    const matchesSearch = 
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      m.provider?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Mantenimiento" 
          description="Gestiona el mantenimiento de tu flota"
          actions={
            <Button 
              onClick={() => { setSelectedMaintenance(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por vehículo, descripción o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-yellow-500/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-zinc-900/50 border-zinc-800 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-zinc-900/50 border-zinc-800 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="preventive">Preventivo</SelectItem>
              <SelectItem value="corrective">Correctivo</SelectItem>
              <SelectItem value="inspection">Inspección</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Maintenance Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl bg-zinc-900/50" />
            ))}
          </div>
        ) : filteredMaintenances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaintenances.map(maintenance => (
              <MaintenanceCard 
                key={maintenance.id} 
                maintenance={maintenance}
                vehiclePlate={vehiclesMap[maintenance.vehicle_id]?.plate}
                onClick={() => handleEdit(maintenance)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Wrench}
            title="Sin mantenimientos"
            description={search ? "No se encontraron mantenimientos con esos criterios" : "Agrega tu primer registro de mantenimiento"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedMaintenance(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Mantenimiento
                </Button>
              )
            }
          />
        )}

        <MaintenanceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          maintenance={selectedMaintenance}
          vehicles={vehicles}
          onSave={handleSave}
          onDelete={selectedMaintenance ? () => deleteMutation.mutate(selectedMaintenance.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
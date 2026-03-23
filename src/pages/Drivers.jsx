import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MobileSelect from "../components/common/MobileSelect";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import DriverCard from "../components/drivers/DriverCard";
import DriverDialog from "../components/drivers/DriverDialog";
import PageWrapper from "../components/common/PageWrapper";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Drivers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    await queryClient.invalidateQueries({ queryKey: ['locations'] });
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', currentUser?.company_id],
    queryFn: async () => {
      const allDrivers = await base44.entities.Driver.list();
      if (currentUser?.company_id) {
        return allDrivers.filter(d => d.company_id === currentUser.company_id);
      }
      return allDrivers;
    },
    enabled: !!currentUser,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', currentUser?.company_id],
    queryFn: async () => {
      const allCompanies = await base44.entities.Company.list();
      if (currentUser?.company_id) {
        return allCompanies.filter(c => c.id === currentUser.company_id);
      }
      return allCompanies;
    },
    enabled: !!currentUser,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', currentUser?.company_id],
    queryFn: async () => {
      const allLocations = await base44.entities.Location.list();
      if (currentUser?.company_id) {
        return allLocations.filter(l => l.company_id === currentUser.company_id);
      }
      return allLocations;
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Driver.create(data),
    onMutate: async (newDriver) => {
      await queryClient.cancelQueries({ queryKey: ['drivers'] });
      const previousDrivers = queryClient.getQueryData(['drivers', currentUser?.company_id]);
      queryClient.setQueryData(['drivers', currentUser?.company_id], (old = []) => [
        ...old,
        { ...newDriver, id: 'temp-' + Date.now() }
      ]);
      return { previousDrivers };
    },
    onError: (err, newDriver, context) => {
      queryClient.setQueryData(['drivers', currentUser?.company_id], context.previousDrivers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['drivers'] });
      const previousDrivers = queryClient.getQueryData(['drivers', currentUser?.company_id]);
      queryClient.setQueryData(['drivers', currentUser?.company_id], (old = []) =>
        old.map(d => d.id === id ? { ...d, ...data } : d)
      );
      return { previousDrivers };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['drivers', currentUser?.company_id], context.previousDrivers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
      setSelectedDriver(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['drivers'] });
      const previousDrivers = queryClient.getQueryData(['drivers', currentUser?.company_id]);
      queryClient.setQueryData(['drivers', currentUser?.company_id], (old = []) =>
        old.filter(d => d.id !== deletedId)
      );
      return { previousDrivers };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['drivers', currentUser?.company_id], context.previousDrivers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
      setSelectedDriver(null);
    },
  });

  const handleSave = async (data) => {
    try {
      // Si hay un vehículo asignado, necesitamos sincronizar el vehicle.assigned_driver_ids
      const previousVehicleId = selectedDriver?.vehicle_id;
      const newVehicleId = data.vehicle_id;
      
      let driverId = selectedDriver?.id;
      
      // 1. Guardar el conductor
      if (selectedDriver) {
        await updateMutation.mutateAsync({ id: selectedDriver.id, data });
        driverId = selectedDriver.id;
      } else {
        const created = await createMutation.mutateAsync(data);
        driverId = created.id;
      }
      
      // 2. Sincronizar vehículos
      // Eliminar del vehículo anterior si cambió
      if (previousVehicleId && previousVehicleId !== newVehicleId) {
        const prevVehicle = await base44.entities.Vehicle.filter({ id: previousVehicleId });
        if (prevVehicle && prevVehicle[0]) {
          const updatedDriverIds = (prevVehicle[0].assigned_driver_ids || []).filter(id => id !== driverId);
          await base44.entities.Vehicle.update(previousVehicleId, { assigned_driver_ids: updatedDriverIds });
        }
      }
      
      // Agregar al nuevo vehículo si se asignó uno
      if (newVehicleId) {
        const newVehicle = await base44.entities.Vehicle.filter({ id: newVehicleId });
        if (newVehicle && newVehicle[0]) {
          const currentDriverIds = newVehicle[0].assigned_driver_ids || [];
          if (!currentDriverIds.includes(driverId)) {
            await base44.entities.Vehicle.update(newVehicleId, { 
              assigned_driver_ids: [...currentDriverIds, driverId] 
            });
          }
        }
      }
      
      // Invalidar queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    } catch (error) {
      console.error("Error al guardar conductor:", error);
      alert("Error al guardar el conductor");
    }
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setDialogOpen(true);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
        <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Conductores" 
          description="Gestiona tu equipo de conductores"
          actions={
            <Button 
              onClick={() => { setSelectedDriver(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Conductor
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
            <Input
              placeholder="Buscar por nombre, documento o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          <MobileSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Estado"
            options={[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activo" },
              { value: "inactive", label: "Inactivo" },
              { value: "on_leave", label: "De baja" },
            ]}
            triggerClassName={cn("w-full sm:w-40", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}
          />
        </div>

        {/* Drivers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-56 rounded-2xl", theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200')} />
            ))}
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map(driver => (
              <DriverCard 
                key={driver.id} 
                driver={driver} 
                onClick={() => handleEdit(driver)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Sin conductores"
            description={search ? "No se encontraron conductores con esos criterios" : "Agrega tu primer conductor para comenzar"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedDriver(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Conductor
                </Button>
              )
            }
          />
        )}

        <DriverDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          driver={selectedDriver}
          onSave={handleSave}
          onDelete={selectedDriver ? () => deleteMutation.mutate(selectedDriver.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          companies={companies}
          locations={locations}
          vehicles={vehicles}
          currentUser={currentUser}
        />
        </div>
      </div>
    </PullToRefresh>
  );
}
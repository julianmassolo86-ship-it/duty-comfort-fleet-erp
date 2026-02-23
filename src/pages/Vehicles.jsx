import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Car, Building2, MapPin, Grid3x3, List, Camera, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import VehicleCard from "../components/vehicles/VehicleCard";
import VehicleTable from "../components/vehicles/VehicleTable";
import VehicleDialog from "../components/vehicles/VehicleDialog";
import QuickVehicleCapture from "../components/vehicles/QuickVehicleCapture";
import PullToRefresh from "../components/common/PullToRefresh";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" o "table"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    await queryClient.invalidateQueries({ queryKey: ['locations'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data } = await base44.functions.invoke('exportVehicles');
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los vehículos');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !currentUser?.company_id;

  const { data: vehicles = [], isLoading } = useQuery({
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

  const { data: drivers = [] } = useQuery({
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

  const { data: manufacturers = [] } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => base44.entities.Manufacturer.list('name'),
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.list('name'),
  });

  // Enriquecer vehículos con el nombre del tipo
  const enrichedVehicles = vehicles.map(vehicle => {
    if (vehicle.type_id) {
      const vehicleType = vehicleTypes.find(vt => vt.id === vehicle.type_id);
      return {
        ...vehicle,
        type_name: vehicleType?.name || 'Sin tipo'
      };
    }
    return vehicle;
  });

  const { data: vehicleCategories = [] } = useQuery({
    queryKey: ['vehicleCategories'],
    queryFn: () => base44.entities.VehicleCategory.list('name'),
  });

  const { data: vehicleStatuses = [] } = useQuery({
    queryKey: ['vehicleStatuses'],
    queryFn: () => base44.entities.VehicleStatus.list(),
  });

  const locationsMap = locations.reduce((acc, l) => ({ ...acc, [l.id]: l }), {});
  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
      setSelectedVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
      setSelectedVehicle(null);
    },
  });

  const handleSave = async (data) => {
    try {
      // Determinar si es edición o creación basándose en el ID incluido en data o en selectedVehicle
      const isEditing = data.id || selectedVehicle?.id;
      const vehicleId = data.id || selectedVehicle?.id;
      
      // Separar el ID del resto de datos para no incluirlo en la actualización
      const { id, ...dataWithoutId } = data;
      
      // Obtener los IDs de conductores anteriores (si es una edición)
      const previousDriverIds = selectedVehicle?.assigned_driver_ids || [];
      const newDriverIds = data.assigned_driver_ids || [];
      
      // 1. Guardar el vehículo
      if (isEditing && vehicleId) {
        await base44.entities.Vehicle.update(vehicleId, dataWithoutId);
      } else {
        const created = await base44.entities.Vehicle.create(dataWithoutId);
      }
      
      // 2. Sincronizar conductores solo si es edición
      if (isEditing && vehicleId) {
        // Eliminar vehículo de conductores que fueron desasignados
        const removedDriverIds = previousDriverIds.filter(id => !newDriverIds.includes(id));
        for (const driverId of removedDriverIds) {
          if (driverId) {
            const driver = await base44.entities.Driver.filter({ id: driverId });
            if (driver && driver[0]) {
              // Si el conductor tenía este vehículo, quitarlo
              if (driver[0].vehicle_id === vehicleId) {
                await base44.entities.Driver.update(driverId, { vehicle_id: "" });
              }
            }
          }
        }
        
        // 3. Asignar vehículo a los nuevos conductores
        const addedDriverIds = newDriverIds.filter(id => !previousDriverIds.includes(id));
        for (const driverId of addedDriverIds) {
          if (driverId) {
            await base44.entities.Driver.update(driverId, { vehicle_id: vehicleId });
          }
        }
      }
      
      // Invalidar queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      
      // Cerrar el diálogo manualmente
      setDialogOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      alert("Error al guardar el vehículo");
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleVehicleFound = (vehicle) => {
    // Vehículo encontrado - abrir en modo edición
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleVehicleNotFound = (extractedData) => {
    // Vehículo no encontrado - abrir diálogo con datos pre-llenados
    setPrefilledData(extractedData);
    setSelectedVehicle(null);
    setDialogOpen(true);
  };

  // Filtrar por empresa del usuario si no es super admin
  const accessibleVehicles = isSuperAdmin 
    ? enrichedVehicles 
    : enrichedVehicles.filter(v => v.company_id === currentUser?.company_id);

  // Locaciones accesibles
  const accessibleLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.company_id === currentUser?.company_id);

  const filteredVehicles = accessibleVehicles.filter(v => {
    const searchTerm = search.replace('#', '').toLowerCase();
    const matchesSearch = 
      v.plate?.toLowerCase().includes(searchTerm) ||
      v.internal_number?.toLowerCase().includes(searchTerm) ||
      v.manufacturer?.toLowerCase().includes(searchTerm) ||
      v.model?.toLowerCase().includes(searchTerm) ||
      v.type_name?.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesLocation = locationFilter === "all" || v.location_id === locationFilter;
    const matchesCompany = companyFilter === "all" || v.company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesLocation && matchesCompany;
  });

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
        <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Vehículos" 
          description="Gestiona tu flota de vehículos"
          actions={
            <div className="flex gap-2 flex-wrap">
              {vehicles.length > 0 && (
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  className={cn("border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
              )}
              {accessibleLocations.length > 0 && (
                <>
                  <Button 
                    onClick={() => setCaptureDialogOpen(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Captura Rápida
                  </Button>
                  <Button 
                    onClick={() => { setSelectedVehicle(null); setPrefilledData(null); setDialogOpen(true); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Vehículo
                  </Button>
                </>
              )}
            </div>
          }
        />

        {accessibleLocations.length === 0 && !isLoading && (
          <div className={cn("mb-6 p-4 rounded-xl border", theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')}>
            <p className={theme === 'dark' ? 'text-amber-200' : 'text-amber-800'}>
              Debes crear al menos una locación antes de agregar vehículos.
            </p>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-6">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-9 w-9",
              viewMode === "grid" && "bg-yellow-500 hover:bg-yellow-600 text-black"
            )}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-9 w-9",
              viewMode === "table" && "bg-yellow-500 hover:bg-yellow-600 text-black"
            )}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
            <Input
              placeholder="Buscar por interno, matrícula, marca, modelo o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          {isSuperAdmin && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className={cn("w-full sm:w-44", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}>
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className={cn("w-full sm:w-44", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}>
              <SelectValue placeholder="Locación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {accessibleLocations.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-40", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {vehicleStatuses
                .filter(s => s.is_active)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(status => (
                  <SelectItem key={status.id} value={status.code}>
                    {status.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Grid/Table */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className={cn("h-48 rounded-2xl", theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200')} />
              ))}
            </div>
          ) : (
            <Skeleton className={cn("h-96 rounded-xl", theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200')} />
          )
        ) : filteredVehicles.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map(vehicle => (
                <VehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle}
                  location={locationsMap[vehicle.location_id]}
                  company={isSuperAdmin ? companiesMap[vehicle.company_id] : null}
                  drivers={drivers}
                  vehicleStatuses={vehicleStatuses}
                  onClick={() => handleEdit(vehicle)}
                />
              ))}
            </div>
          ) : (
            <VehicleTable 
              vehicles={filteredVehicles}
              locations={accessibleLocations}
              companies={companies}
              drivers={drivers}
              vehicleStatuses={vehicleStatuses}
              isSuperAdmin={isSuperAdmin}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )
        ) : (
          <EmptyState
            icon={Car}
            title="Sin vehículos"
            description={search ? "No se encontraron vehículos con esos criterios" : "Agrega tu primer vehículo para comenzar"}
            action={
              !search && accessibleLocations.length > 0 && (
                <Button 
                  onClick={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Vehículo
                </Button>
              )
            }
          />
        )}

        <VehicleDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setPrefilledData(null);
          }}
          vehicle={selectedVehicle}
          prefilledData={prefilledData}
          drivers={drivers.filter(d => isSuperAdmin || d.company_id === currentUser?.company_id)}
          locations={accessibleLocations}
          companies={companies}
          manufacturers={manufacturers}
          vehicleTypes={vehicleTypes}
          vehicleCategories={vehicleCategories}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={selectedVehicle ? () => deleteMutation.mutate(selectedVehicle.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />

        <QuickVehicleCapture
          open={captureDialogOpen}
          onOpenChange={setCaptureDialogOpen}
          onVehicleFound={handleVehicleFound}
          onVehicleNotFound={handleVehicleNotFound}
          theme={theme}
        />
        </div>
      </div>
    </PullToRefresh>
  );
}
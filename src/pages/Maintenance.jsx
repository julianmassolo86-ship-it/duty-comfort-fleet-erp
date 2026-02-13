import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench, AlertCircle, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import MaintenanceCard from "../components/maintenance/MaintenanceCard";
import MaintenanceDialog from "../components/maintenance/MaintenanceDialog";
import NovedadDialog from "../components/novedades/NovedadDialog";
import NovedadCard from "../components/novedades/NovedadCard";
import AirConditioningMaintenanceDialog from "../components/ac-maintenance/AirConditioningMaintenanceDialog";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Maintenance() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState(tabFromUrl === "novedades" ? "novedades" : "mantenimientos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novedadDialogOpen, setNovedadDialogOpen] = useState(false);
  const [acDialogOpen, setAcDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [selectedAcMaintenance, setSelectedAcMaintenance] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['maintenances'] });
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    await queryClient.invalidateQueries({ queryKey: ['novedades'] });
    await queryClient.invalidateQueries({ queryKey: ['ac-maintenances'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Pull to refresh gesture
  useEffect(() => {
    let startY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (scrollTop === 0 && pullDistance > 100 && !isRefreshing) {
        handleRefresh();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isRefreshing]);

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

  const { data: novedades = [], isLoading: isLoadingNovedades } = useQuery({
    queryKey: ['novedades', currentUser?.company_id],
    queryFn: async () => {
      const allNovedades = await base44.entities.Novedad.list('-fecha_reporte');
      if (currentUser?.company_id) {
        return allNovedades.filter(n => n.company_id === currentUser.company_id);
      }
      return allNovedades;
    },
    enabled: !!currentUser,
  });

  const { data: acMaintenances = [], isLoading: isLoadingAc } = useQuery({
    queryKey: ['ac-maintenances', currentUser?.company_id],
    queryFn: async () => {
      const allAc = await base44.entities.AirConditioningMaintenance.list('-inspection_date');
      if (currentUser?.company_id) {
        return allAc.filter(ac => ac.company_id === currentUser.company_id);
      }
      return allAc;
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

  const updateNovedadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Novedad.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novedades'] });
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

  const handleUpdateNovedadEstado = (novedad, nuevoEstado) => {
    updateNovedadMutation.mutate({ 
      id: novedad.id, 
      data: { ...novedad, estado: nuevoEstado } 
    });
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

  const filteredNovedades = novedades.filter(n => {
    const vehicle = vehiclesMap[n.vehicle_id];
    const matchesSearch = 
      n.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle?.plate?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        {isRefreshing && (
          <div className={cn(
            "fixed top-16 left-0 right-0 z-50 flex items-center justify-center py-2",
            theme === 'dark' ? 'bg-zinc-900/90' : 'bg-white/90'
          )}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
            <span className={cn("ml-2 text-sm", theme === 'dark' ? 'text-zinc-300' : 'text-gray-700')}>
              Actualizando...
            </span>
          </div>
        )}
        <PageHeader 
          title="Mantenimiento" 
          description="Gestiona el mantenimiento y novedades de tu flota"
          actions={
            <div className="flex gap-2">
              <Button 
                onClick={() => { setSelectedAcMaintenance(null); setAcDialogOpen(true); }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold"
              >
                <Wind className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Inspección A/C</span>
                <span className="sm:hidden">A/C</span>
              </Button>
              <Button 
                onClick={() => { setNovedadDialogOpen(true); }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <Wrench className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novedad Diaria</span>
                <span className="sm:hidden">Novedad</span>
              </Button>
              <Button 
                onClick={() => { setSelectedMaintenance(null); setDialogOpen(true); }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Mantenimiento</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className={theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}>
            <TabsTrigger value="mantenimientos">Mantenimientos</TabsTrigger>
            <TabsTrigger value="ac">
              A/C
              {acMaintenances.filter(ac => ac.status === 'en_proceso').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-green-500 text-white">
                  {acMaintenances.filter(ac => ac.status === 'en_proceso').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="novedades">
              Novedades
              {novedades.filter(n => n.estado === 'pendiente').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                  {novedades.filter(n => n.estado === 'pendiente').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={activeTab === 'mantenimientos' ? "Buscar por vehículo, descripción o proveedor..." : "Buscar por vehículo o descripción..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "pl-10",
                theme === 'dark' 
                  ? 'bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-yellow-500/50'
                  : 'bg-white border-gray-200 placeholder:text-gray-400'
              )}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "w-full sm:w-40",
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-gray-200'
            )}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {activeTab === 'mantenimientos' ? (
                <>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {activeTab === 'mantenimientos' && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={cn(
                "w-full sm:w-40",
                theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-gray-200'
              )}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="preventive">Preventivo</SelectItem>
                <SelectItem value="corrective">Correctivo</SelectItem>
                <SelectItem value="inspection">Inspección</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Maintenance Grid */}
        {activeTab === 'ac' ? (
          isLoadingAc ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className={cn("h-52 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
              ))}
            </div>
          ) : acMaintenances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acMaintenances.map(ac => {
                const vehicle = vehiclesMap[ac.vehicle_id];
                return (
                  <div 
                    key={ac.id}
                    onClick={() => { setSelectedAcMaintenance(ac); setAcDialogOpen(true); }}
                    className={cn(
                      "p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg",
                      theme === 'dark' 
                        ? 'bg-zinc-900/50 border-zinc-800 hover:border-green-500/50' 
                        : 'bg-white border-gray-200 hover:border-green-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Wind className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                            {vehicle?.internal_number || 'N/A'} - {vehicle?.plate || 'Sin patente'}
                          </p>
                          <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                            {vehicle?.manufacturer} {vehicle?.model}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        ac.status === 'completado' 
                          ? 'bg-green-500/10 text-green-600' 
                          : ac.status === 'aprobado'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-yellow-500/10 text-yellow-600'
                      )}>
                        {ac.status === 'completado' ? 'Completado' : ac.status === 'aprobado' ? 'Aprobado' : 'En Proceso'}
                      </span>
                    </div>
                    <div className={cn("text-sm space-y-1", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                      <p>📅 {ac.inspection_date.split('T')[0].split('-').reverse().join('/')}</p>
                      <p>🌡️ Temp. Ambiente: {ac.ambient_temperature}°C</p>
                      {ac.odometer_reading && <p>📊 {ac.odometer_reading} km/hs</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Wind}
              title="Sin inspecciones de A/C"
              description="Registra la primera inspección de aire acondicionado"
              action={
                <Button 
                  onClick={() => { setSelectedAcMaintenance(null); setAcDialogOpen(true); }}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  <Wind className="w-4 h-4 mr-2" />
                  Nueva Inspección A/C
                </Button>
              }
            />
          )
        ) : activeTab === 'mantenimientos' ? (
          isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className={cn("h-52 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
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
          )
        ) : (
          isLoadingNovedades ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className={cn("h-40 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
              ))}
            </div>
          ) : filteredNovedades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNovedades.map(novedad => (
                <NovedadCard
                  key={novedad.id}
                  novedad={novedad}
                  vehicle={vehiclesMap[novedad.vehicle_id]}
                  onUpdateEstado={handleUpdateNovedadEstado}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Sin novedades"
              description={search ? "No se encontraron novedades con esos criterios" : "Registra la primera novedad diaria"}
              action={
                !search && (
                  <Button 
                    onClick={() => { setNovedadDialogOpen(true); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Registrar Novedad
                  </Button>
                )
              }
            />
          )
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

        <NovedadDialog
          open={novedadDialogOpen}
          onOpenChange={setNovedadDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['novedades'] });
            setActiveTab('novedades');
          }}
        />

        <AirConditioningMaintenanceDialog
          open={acDialogOpen}
          onOpenChange={setAcDialogOpen}
          maintenance={selectedAcMaintenance}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ac-maintenances'] });
            setAcDialogOpen(false);
            setSelectedAcMaintenance(null);
            setActiveTab('ac');
          }}
        />
      </div>
    </div>
  );
}
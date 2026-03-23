import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench, AlertCircle, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MobileSelect from "../components/common/MobileSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import MaintenanceCard from "../components/maintenance/MaintenanceCard";
import MaintenanceDialog from "../components/maintenance/MaintenanceDialog";
import NovedadDialog from "../components/novedades/NovedadDialog";
import NovedadCard from "../components/novedades/NovedadCard";
import AirConditioningMaintenanceDialog from "../components/ac-maintenance/AirConditioningMaintenanceDialog";
import { useTheme } from "../components/common/ThemeWrapper";
import { useLocation, useNavigate } from "react-router-dom";
import PageWrapper from "../components/common/PageWrapper";

export default function Maintenance() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
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
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['maintenances'] }),
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      queryClient.invalidateQueries({ queryKey: ['novedades'] }),
      queryClient.invalidateQueries({ queryKey: ['ac-maintenances'] }),
    ]);
  };

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

  // Manejo de apertura directa de informes desde URL
  useEffect(() => {
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    if (type && id && currentUser) {
      if (type === 'ac') {
        if (acMaintenances.length > 0) {
          const record = acMaintenances.find(r => r.id === id);
          if (record) {
            setSelectedAcMaintenance(record);
            setAcDialogOpen(true);
            navigate(location.pathname, { replace: true });
          }
        }
      } else if (type === 'maintenance') {
        if (maintenances.length > 0) {
          const record = maintenances.find(r => r.id === id);
          if (record) {
            setSelectedMaintenance(record);
            setDialogOpen(true);
            navigate(location.pathname, { replace: true });
          }
        }
      }
    }
  }, [urlParams, currentUser, maintenances, acMaintenances, location.pathname, navigate]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['maintenances'] });
      const previous = queryClient.getQueryData(['maintenances', currentUser?.company_id]);
      queryClient.setQueryData(['maintenances', currentUser?.company_id], (old = []) => [
        { ...newData, id: `temp-${Date.now()}`, _optimistic: true }, ...old
      ]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['maintenances', currentUser?.company_id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Maintenance.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['maintenances'] });
      const previous = queryClient.getQueryData(['maintenances', currentUser?.company_id]);
      queryClient.setQueryData(['maintenances', currentUser?.company_id], (old = []) =>
        old.map(m => m.id === id ? { ...m, ...data } : m)
      );
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['maintenances', currentUser?.company_id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
      setSelectedMaintenance(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Maintenance.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['maintenances'] });
      const previous = queryClient.getQueryData(['maintenances', currentUser?.company_id]);
      queryClient.setQueryData(['maintenances', currentUser?.company_id], (old = []) =>
        old.filter(m => m.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['maintenances', currentUser?.company_id], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
      setSelectedMaintenance(null);
    },
  });

  const updateNovedadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Novedad.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['novedades'] });
      const previous = queryClient.getQueryData(['novedades', currentUser?.company_id]);
      queryClient.setQueryData(['novedades', currentUser?.company_id], (old = []) =>
        old.map(n => n.id === id ? { ...n, ...data } : n)
      );
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['novedades', currentUser?.company_id], ctx.previous);
    },
    onSettled: () => {
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
    <PageWrapper onRefresh={handleRefresh}>
        <PageHeader 
          title="Mantenimiento" 
          description="Gestiona el mantenimiento y novedades de tu flota"
          actions={
            <div className="flex gap-2">
              <Button 
                onClick={() => { setSelectedAcMaintenance(null); setAcDialogOpen(true); }}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold"
              >
                <Wind className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Informe A/C</span>
                <span className="sm:hidden">A/C</span>
              </Button>
              <Button 
                onClick={() => { setNovedadDialogOpen(true); }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold"
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
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-sky-500 text-white">
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
          <MobileSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Estado"
            options={activeTab === 'mantenimientos' ? [
              { value: "all", label: "Todos" },
              { value: "scheduled", label: "Programado" },
              { value: "in_progress", label: "En progreso" },
              { value: "completed", label: "Completado" },
              { value: "cancelled", label: "Cancelado" },
            ] : [
              { value: "all", label: "Todos" },
              { value: "pendiente", label: "Pendiente" },
              { value: "en_proceso", label: "En Proceso" },
              { value: "resuelto", label: "Resuelto" },
              { value: "cerrado", label: "Cerrado" },
            ]}
            triggerClassName={cn("w-full sm:w-40", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-gray-200')}
          />
          {activeTab === 'mantenimientos' && (
            <MobileSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="Tipo"
              options={[
                { value: "all", label: "Todos" },
                { value: "preventive", label: "Preventivo" },
                { value: "corrective", label: "Correctivo" },
                { value: "inspection", label: "Inspección" },
              ]}
              triggerClassName={cn("w-full sm:w-40", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-gray-200')}
            />
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
                        ? 'bg-zinc-900/50 border-zinc-800 hover:border-sky-500/50' 
                        : 'bg-white border-gray-200 hover:border-sky-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                          <Wind className="w-5 h-5 text-sky-500" />
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
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium uppercase",
                        ac.tipo_mantenimiento === 'preventivo'
                          ? theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                          : ac.tipo_mantenimiento === 'correctivo'
                          ? theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-600'
                          : theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/10 text-purple-600'
                      )}>
                        {ac.tipo_mantenimiento || 'preventivo'}
                      </span>
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium",
                        ac.status === 'completado' 
                          ? theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                          : ac.status === 'aprobado'
                          ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-500/10 text-green-600'
                          : theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-500/10 text-orange-600'
                      )}>
                        {ac.status === 'completado' ? 'Completado' : ac.status === 'aprobado' ? 'Aprobado' : 'En Proceso'}
                      </span>
                    </div>
                    
                    <div className={cn("text-sm space-y-1", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                      <p className="flex items-center gap-2">
                        📋 <span className="font-mono font-medium">{ac.report_number || 'Sin número'}</span>
                      </p>
                      <p>📅 {ac.inspection_date.split('T')[0].split('-').reverse().join('/')}</p>
                      <p>🌡️ Temp. Ambiente: {ac.ambient_temperature}°C</p>
                      {(ac.kilometraje || ac.horas) && (
                        <p>📊 {[ac.kilometraje ? `${ac.kilometraje} km` : '', ac.horas ? `${ac.horas} hs` : ''].filter(Boolean).join(' / ')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Wind}
              title="Sin informes de A/C"
              description="Registra el primer informe de aire acondicionado"
              action={
                <Button 
                  onClick={() => { setSelectedAcMaintenance(null); setAcDialogOpen(true); }}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                >
                  <Wind className="w-4 h-4 mr-2" />
                  Nuevo Informe A/C
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
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold"
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


    </PageWrapper>
  );
}
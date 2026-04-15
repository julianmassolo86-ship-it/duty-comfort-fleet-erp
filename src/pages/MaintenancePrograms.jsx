import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Settings2, CheckCircle2, Wrench, Package, Zap } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import PullToRefresh from "@/components/common/PullToRefresh";
import MaintenanceProgramDialog from "@/components/maintenance-programs/MaintenanceProgramDialog";
import MaintenanceProgramCard from "@/components/maintenance-programs/MaintenanceProgramCard";
import BulkAssignDialog from "@/components/maintenance-programs/BulkAssignDialog";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "Todos", icon: Settings2 },
  { key: "program", label: "Programas", icon: Package },
  { key: "action", label: "Acciones", icon: Zap },
  { key: "item", label: "Ítems / Componentes", icon: Wrench },
];

export default function MaintenancePrograms() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [defaultType, setDefaultType] = useState("item");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isSuperAdmin = !user?.company_id || user?.user_role === 'super_admin';
  const userCompanyId = user?.company_id;

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['maintenanceTaskDefinitions', userCompanyId],
    queryFn: async () => {
      if (isSuperAdmin) {
        return await base44.entities.MaintenanceTaskDefinition.list();
      }
      return await base44.entities.MaintenanceTaskDefinition.filter({ company_id: userCompanyId });
    },
    enabled: !!user,
  });

  const { data: manufacturers = [] } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => base44.entities.Manufacturer.list(),
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicleModels'],
    queryFn: () => base44.entities.VehicleModel.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceTaskDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTaskDefinitions'] });
      setDialogOpen(false);
      setSelectedProgram(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceTaskDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTaskDefinitions'] });
      setDialogOpen(false);
      setSelectedProgram(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceTaskDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTaskDefinitions'] });
      setDialogOpen(false);
      setSelectedProgram(null);
    },
  });

  const handleSave = (data) => {
    const finalData = {
      ...data,
      company_id: isSuperAdmin ? data.company_id : userCompanyId,
    };
    if (selectedProgram) {
      updateMutation.mutate({ id: selectedProgram.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleDelete = () => {
    if (selectedProgram) deleteMutation.mutate(selectedProgram.id);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setDialogOpen(true);
  };

  const handleNew = (type) => {
    setSelectedProgram(null);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['maintenanceTaskDefinitions'] });
  };

  // Normaliza el tipo para compatibilidad con registros viejos
  const getTaskType = (p) => {
    if (p.task_type) return p.task_type;
    if (p.is_program_group) return "program";
    return "item";
  };

  const filteredPrograms = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return programs
      .filter(p => p.is_active !== false)
      .filter(p => {
        if (activeTab !== "all") return getTaskType(p) === activeTab;
        return true;
      })
      .filter(p => {
        if (!term) return true;
        const manufacturerName = manufacturers.find(m => m.id === p.applies_to_manufacturer_id)?.name || "";
        return (
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.part_number?.toLowerCase().includes(term) ||
          manufacturerName.toLowerCase().includes(term)
        );
      });
  }, [programs, searchTerm, activeTab, manufacturers]);

  const counts = useMemo(() => ({
    all: programs.filter(p => p.is_active !== false).length,
    program: programs.filter(p => p.is_active !== false && getTaskType(p) === "program").length,
    action: programs.filter(p => p.is_active !== false && getTaskType(p) === "action").length,
    item: programs.filter(p => p.is_active !== false && getTaskType(p) === "item").length,
  }), [programs]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  const activePrograms = programs.filter(p => p.is_active !== false && getTaskType(p) === "program");

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-black pb-20 lg:pb-8">
        <PageHeader
          title="Programas de Mantenimiento"
          subtitle="Gestiona ítems, acciones y programas de mantenimiento"
          icon={Settings2}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Acciones rápidas */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleNew("item")}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 hover:bg-zinc-800 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Wrench className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nuevo Ítem</p>
                <p className="text-xs text-zinc-500">Filtro, aceite, etc.</p>
              </div>
            </button>
            <button
              onClick={() => handleNew("action")}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 hover:bg-zinc-800 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nueva Acción</p>
                <p className="text-xs text-zinc-500">Engrase, purga, etc.</p>
              </div>
            </button>
            <button
              onClick={() => handleNew("program")}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 hover:bg-zinc-800 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Package className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nuevo Programa</p>
                <p className="text-xs text-zinc-500">Agrupa ítems y acciones</p>
              </div>
            </button>
          </div>

          {/* Buscador y asignar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-yellow-500/50"
              />
            </div>
            <Button
              onClick={() => setBulkAssignOpen(true)}
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Asignar a Vehículos
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-yellow-500 text-black"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs opacity-60">({counts[tab.key]})</span>
              </button>
            ))}
          </div>

          {/* Listado */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <EmptyState
              icon={Settings2}
              title="No hay registros"
              description="Crea ítems, acciones o programas usando los botones de arriba"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.map((program) => (
                <MaintenanceProgramCard
                  key={program.id}
                  program={program}
                  manufacturers={manufacturers}
                  vehicleTypes={vehicleTypes}
                  allPrograms={programs}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        <MaintenanceProgramDialog
           open={dialogOpen}
           onOpenChange={setDialogOpen}
           program={selectedProgram}
           manufacturers={manufacturers}
           vehicleTypes={vehicleTypes}
           vehicleModels={vehicleModels}
           allPrograms={programs}
           isSuperAdmin={isSuperAdmin}
           currentUser={user}
           defaultType={defaultType}
           onSave={handleSave}
           onDelete={handleDelete}
           isLoading={createMutation.isPending || updateMutation.isPending}
           isDeleting={deleteMutation.isPending}
         />

        <BulkAssignDialog
          open={bulkAssignOpen}
          onOpenChange={setBulkAssignOpen}
          programs={activePrograms}
          isSuperAdmin={isSuperAdmin}
          currentUser={user}
        />
      </div>
    </PullToRefresh>
  );
}
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Settings2, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import PullToRefresh from "@/components/common/PullToRefresh";
import MaintenanceProgramDialog from "@/components/maintenance-programs/MaintenanceProgramDialog";
import MaintenanceProgramCard from "@/components/maintenance-programs/MaintenanceProgramCard";
import BulkAssignDialog from "@/components/maintenance-programs/BulkAssignDialog";

export default function MaintenancePrograms() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
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
    if (selectedProgram) {
      deleteMutation.mutate(selectedProgram.id);
    }
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setDialogOpen(true);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['maintenanceTaskDefinitions'] });
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(program =>
      program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programs, searchTerm]);

  const activePrograms = filteredPrograms.filter(p => p.is_active !== false);
  const inactivePrograms = filteredPrograms.filter(p => p.is_active === false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-black pb-20 lg:pb-8">
        <PageHeader
          title="Programas de Mantenimiento"
          subtitle="Configura los servicios de mantenimiento para tu flota"
          icon={Settings2}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                placeholder="Buscar programas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-yellow-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setBulkAssignOpen(true)}
                variant="outline"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Asignar a Vehículos
              </Button>
              <Button
                onClick={() => {
                  setSelectedProgram(null);
                  setDialogOpen(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Programa
              </Button>
            </div>
          </div>

          {/* Programs Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : activePrograms.length === 0 && inactivePrograms.length === 0 ? (
            <EmptyState
              icon={Settings2}
              title="No hay programas configurados"
              description="Crea tu primer programa de mantenimiento para comenzar"
              action={
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Programa
                </Button>
              }
            />
          ) : (
            <>
              {activePrograms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                    Programas Activos ({activePrograms.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activePrograms.map((program) => (
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
                </div>
              )}

              {inactivePrograms.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-zinc-600 mb-3 uppercase tracking-wider">
                    Programas Inactivos ({inactivePrograms.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inactivePrograms.map((program) => (
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
                </div>
              )}
            </>
          )}
        </div>

        <MaintenanceProgramDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          program={selectedProgram}
          manufacturers={manufacturers}
          vehicleTypes={vehicleTypes}
          allPrograms={programs}
          isSuperAdmin={isSuperAdmin}
          currentUser={user}
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
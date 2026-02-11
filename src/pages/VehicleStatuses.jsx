import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import VehicleStatusCard from "../components/vehicle-statuses/VehicleStatusCard";
import VehicleStatusDialog from "../components/vehicle-statuses/VehicleStatusDialog";
import { useTheme } from "../components/common/ThemeWrapper";

export default function VehicleStatuses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['vehicleStatuses'],
    queryFn: () => base44.entities.VehicleStatus.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleStatus.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleStatuses'] });
      setDialogOpen(false);
      setEditingStatus(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehicleStatus.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleStatuses'] });
      setDialogOpen(false);
      setEditingStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleStatus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleStatuses'] });
    },
  });

  const handleSave = (data) => {
    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este estado?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStatuses = statuses
    .filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Estados de Vehículos" 
          description="Gestiona los estados disponibles para los vehículos"
          actions={
            <Button 
              onClick={() => {
                setEditingStatus(null);
                setDialogOpen(true);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Estado
            </Button>
          }
        />

        <div className="mb-6">
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')} />
            <Input
              placeholder="Buscar estados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200')}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-40 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
            ))}
          </div>
        ) : filteredStatuses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStatuses.map((status) => (
              <VehicleStatusCard
                key={status.id}
                status={status}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay estados"
            description={searchTerm ? "No se encontraron estados con ese criterio" : "Comienza creando tu primer estado"}
            action={!searchTerm && (
              <Button 
                onClick={() => {
                  setEditingStatus(null);
                  setDialogOpen(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Estado
              </Button>
            )}
          />
        )}
      </div>

      <VehicleStatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={editingStatus}
        onSave={handleSave}
        onDelete={editingStatus ? () => handleDelete(editingStatus.id) : undefined}
      />
    </div>
  );
}
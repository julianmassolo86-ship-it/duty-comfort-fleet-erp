import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import VehicleTypeCard from "@/components/vehicle-types/VehicleTypeCard";
import VehicleTypeDialog from "@/components/vehicle-types/VehicleTypeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";

export default function VehicleTypesPage() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: vehicleTypes = [], isLoading } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const createVehicleTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setDialogOpen(false);
      setSelectedVehicleType(null);
    },
  });

  const updateVehicleTypeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehicleType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setDialogOpen(false);
      setSelectedVehicleType(null);
    },
  });

  const deleteVehicleTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setDialogOpen(false);
      setSelectedVehicleType(null);
    },
  });

  const handleOpenDialog = (vehicleType = null) => {
    setSelectedVehicleType(vehicleType);
    setDialogOpen(true);
  };

  const handleSave = (data) => {
    if (selectedVehicleType) {
      updateVehicleTypeMutation.mutate({ id: selectedVehicleType.id, data });
    } else {
      createVehicleTypeMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    deleteVehicleTypeMutation.mutate(id);
  };

  const filteredVehicleTypes = vehicleTypes.filter((vt) =>
    vt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vt.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Solo super admins pueden acceder
  const isSuperAdmin = !user?.company_id;

  if (user && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState
          title="Acceso Restringido"
          description="Solo los super administradores pueden gestionar tipos de vehículos."
        />
      </div>
    );
  }

  return (
    <div className={cn("p-6", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Tipos de Vehículos"
          subtitle="Gestiona los tipos de vehículos disponibles en el sistema"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Tipo
            </Button>
          }
        />

        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
            theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
          )} />
          <Input
            placeholder="Buscar tipos de vehículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-9",
              theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : ''
            )}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredVehicleTypes.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No se encontraron tipos" : "No hay tipos de vehículos"}
            description={
              searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Comienza creando tu primer tipo de vehículo"
            }
            action={
              !searchTerm && (
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Tipo
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicleTypes.map((vehicleType) => (
              <VehicleTypeCard
                key={vehicleType.id}
                vehicleType={vehicleType}
                onClick={() => handleOpenDialog(vehicleType)}
              />
            ))}
          </div>
        )}

        <VehicleTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vehicleType={selectedVehicleType}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
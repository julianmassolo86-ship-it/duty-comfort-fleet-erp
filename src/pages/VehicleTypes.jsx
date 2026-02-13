import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import VehicleTypeCard from "@/components/vehicle-types/VehicleTypeCard";
import VehicleTypeDialog from "@/components/vehicle-types/VehicleTypeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useTheme } from "@/components/common/ThemeWrapper";

export default function VehicleTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: vehicleTypes = [], isLoading: isLoadingVehicleTypes } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const { data: vehicleCategories = [], isLoading: isLoadingVehicleCategories } = useQuery({
    queryKey: ['vehicleCategories'],
    queryFn: () => base44.entities.VehicleCategory.list(),
  });

  const categoriesMap = new Map(vehicleCategories.map(cat => [cat.id, cat.name]));

  const vehicleTypesWithCategoryName = vehicleTypes.map(vt => ({
    ...vt,
    category_name: categoriesMap.get(vt.category_id) || "Sin categoría"
  }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehicleType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setIsDialogOpen(false);
      setSelectedVehicleType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      setIsDialogOpen(false);
      setSelectedVehicleType(null);
    },
  });

  const filteredVehicleTypes = vehicleTypesWithCategoryName.filter((vt) =>
    vt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vt.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = !user?.company_id || user?.user_role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Tipos de Vehículo"
        description="Gestiona los tipos de vehículos del sistema"
        actions={
          <Button onClick={() => {
            setSelectedVehicleType(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tipo
          </Button>
        }
      />

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar tipos de vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-200'}`}
          />
        </div>
      </div>

      <div className="space-y-6">
        {(isLoadingVehicleTypes || isLoadingVehicleCategories) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredVehicleTypes.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No se encontraron tipos" : "No hay tipos de vehículos"}
            description={searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza creando un nuevo tipo de vehículo"}
            action={!searchTerm && (
              <Button onClick={() => {
                setSelectedVehicleType(null);
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Tipo
              </Button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicleTypes.map((vt) => (
              <VehicleTypeCard
                key={vt.id}
                vehicleType={vt}
                onClick={() => {
                  setSelectedVehicleType(vt);
                  setIsDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <VehicleTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        vehicleType={selectedVehicleType}
        onSave={(data) => {
          if (selectedVehicleType) {
            updateMutation.mutate({ id: selectedVehicleType.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
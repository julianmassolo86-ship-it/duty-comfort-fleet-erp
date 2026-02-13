import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import VehicleCategoryCard from "@/components/vehicle-categories/VehicleCategoryCard";
import VehicleCategoryDialog from "@/components/vehicle-categories/VehicleCategoryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";

export default function VehicleCategoriesPage() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['vehicleCategories'],
    queryFn: () => base44.entities.VehicleCategory.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleCategories'] });
    },
    onSettled: () => {
      setDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehicleCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleCategories'] });
    },
    onSettled: () => {
      setDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleCategories'] });
    },
    onSettled: () => {
      setDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const handleOpenDialog = (category = null) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    if (createMutation.isPending || updateMutation.isPending) return;
    
    if (selectedCategory) {
      await updateMutation.mutateAsync({ id: selectedCategory.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = !user?.company_id;

  if (user && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState
          title="Acceso Restringido"
          description="Solo los super administradores pueden gestionar categorías de vehículos."
        />
      </div>
    );
  }

  return (
    <div className={cn("p-6", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Categorías de Vehículos"
          subtitle="Gestiona las categorías de vehículos disponibles en el sistema"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </Button>
          }
        />

        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
            theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
          )} />
          <Input
            placeholder="Buscar categorías..."
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
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No se encontraron categorías" : "No hay categorías"}
            description={
              searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Comienza creando tu primera categoría de vehículo"
            }
            action={
              !searchTerm && (
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Categoría
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <VehicleCategoryCard
                key={category.id}
                category={category}
                onClick={() => handleOpenDialog(category)}
              />
            ))}
          </div>
        )}

        <VehicleCategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={selectedCategory}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
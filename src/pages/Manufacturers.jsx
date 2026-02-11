import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ManufacturerCard from "@/components/manufacturers/ManufacturerCard";
import ManufacturerDialog from "@/components/manufacturers/ManufacturerDialog";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManufacturersPage() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch manufacturers
  const { data: manufacturers = [], isLoading } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => base44.entities.Manufacturer.list('-created_date'),
  });

  // Create manufacturer
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Manufacturer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setDialogOpen(false);
      setSelectedManufacturer(null);
    },
  });

  // Update manufacturer
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Manufacturer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setDialogOpen(false);
      setSelectedManufacturer(null);
    },
  });

  // Delete manufacturer
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Manufacturer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setDialogOpen(false);
      setSelectedManufacturer(null);
    },
  });

  const handleSave = (data) => {
    if (selectedManufacturer) {
      updateMutation.mutate({ id: selectedManufacturer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleCardClick = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedManufacturer(null);
    setDialogOpen(true);
  };

  // Filter manufacturers
  const filteredManufacturers = manufacturers.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = !user?.company_id;

  // Si no es super admin, no puede acceder
  if (user && !isSuperAdmin) {
    return (
      <div className="p-6">
        <div className={cn(
          "rounded-lg border p-8 text-center",
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white'
        )}>
          <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Marcas de Vehículos"
        description="Gestiona las marcas y sus logos"
        actions={
          <Button
            onClick={handleAddNew}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Marca
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
          theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
        )} />
        <Input
          placeholder="Buscar marcas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "pl-10",
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : ''
          )}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredManufacturers.length === 0 ? (
        <EmptyState
          title={searchTerm ? "No se encontraron marcas" : "No hay marcas"}
          description={searchTerm ? "Intenta con otro término de búsqueda" : "Comienza agregando tu primera marca de vehículo"}
          action={!searchTerm && (
            <Button onClick={handleAddNew} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Marca
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManufacturers.map((manufacturer) => (
            <ManufacturerCard
              key={manufacturer.id}
              manufacturer={manufacturer}
              onClick={() => handleCardClick(manufacturer)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <ManufacturerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        manufacturer={selectedManufacturer}
        onSave={handleSave}
        onDelete={handleDelete}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
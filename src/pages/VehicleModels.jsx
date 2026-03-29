import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Car } from "lucide-react";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import VehicleModelDialog from "@/components/vehicle-models/VehicleModelDialog";

export default function VehicleModelsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: vehicleModels = [], isLoading } = useQuery({
    queryKey: ["vehicleModels"],
    queryFn: () => base44.entities.VehicleModel.list(),
  });

  const { data: manufacturers = [] } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: () => base44.entities.Manufacturer.list(),
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["vehicleTypes"],
    queryFn: () => base44.entities.VehicleType.list(),
  });

  const { data: vehicleCategories = [] } = useQuery({
    queryKey: ["vehicleCategories"],
    queryFn: () => base44.entities.VehicleCategory.list(),
  });

  const manufacturersMap = new Map(manufacturers.map((m) => [m.id, m]));
  const categoriesMap = new Map(vehicleCategories.map((c) => [c.id, c.name]));
  const vehicleTypesMap = new Map(
    vehicleTypes.map((vt) => [
      vt.id,
      { ...vt, display_name: `${categoriesMap.get(vt.category_id) || "Sin categoría"} - ${vt.name}` },
    ])
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleModel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleModels"] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VehicleModel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleModels"] });
      setIsDialogOpen(false);
      setSelectedModel(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleModel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleModels"] });
      setIsDialogOpen(false);
      setSelectedModel(null);
    },
  });

  const isSuperAdmin = !user?.company_id || user?.user_role === "super_admin";

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className={isDark ? "text-zinc-400" : "text-gray-600"}>
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  const filtered = vehicleModels.filter((m) => {
    const manufacturer = manufacturersMap.get(m.manufacturer_id);
    return (
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group by manufacturer
  const grouped = filtered.reduce((acc, model) => {
    const mId = model.manufacturer_id || "sin_fabricante";
    if (!acc[mId]) acc[mId] = [];
    acc[mId].push(model);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Modelos de Vehículo"
        description="Gestiona los modelos precargados por fabricante"
        actions={
          <Button
            onClick={() => {
              setSelectedModel(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Modelo
          </Button>
        }
      />

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar modelos o fabricantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${isDark ? "bg-zinc-900 border-zinc-700 text-white" : ""}`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("h-24 rounded-xl animate-pulse", isDark ? "bg-zinc-800" : "bg-gray-100")} />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <Car className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-zinc-600" : "text-gray-400")} />
          <p className={isDark ? "text-zinc-400" : "text-gray-500"}>
            {searchTerm ? "No se encontraron modelos" : "No hay modelos cargados aún"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Crear Primer Modelo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([manufacturerId, models]) => {
            const manufacturer = manufacturersMap.get(manufacturerId);
            return (
              <div key={manufacturerId}>
                <div className="flex items-center gap-3 mb-3">
                  {manufacturer?.logo_url && (
                    <img src={manufacturer.logo_url} alt={manufacturer.name} className="h-7 w-auto object-contain" />
                  )}
                  <h3 className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-800")}>
                    {manufacturer?.name || "Sin Fabricante"}
                  </h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-500")}>
                    {models.length} modelo{models.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {models.map((model) => {
                    const vType = vehicleTypesMap.get(model.vehicle_type_id);
                    return (
                      <div
                        key={model.id}
                        className={cn(
                          "p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:border-yellow-500/50 transition-colors",
                          isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
                        )}
                        onClick={() => {
                          setSelectedModel(model);
                          setIsDialogOpen(true);
                        }}
                      >
                        <div>
                          <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                            {model.name}
                          </p>
                          {vType && (
                            <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-500" : "text-gray-500")}>
                              {vType.display_name}
                            </p>
                          )}
                        </div>
                        <Pencil className={cn("w-4 h-4", isDark ? "text-zinc-600" : "text-gray-400")} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VehicleModelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        vehicleModel={selectedModel}
        manufacturers={manufacturers}
        vehicleTypes={vehicleTypes}
        vehicleCategories={vehicleCategories}
        onSave={(data) => {
          if (selectedModel) {
            updateMutation.mutate({ id: selectedModel.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
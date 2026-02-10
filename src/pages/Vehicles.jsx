import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Car, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import VehicleCard from "../components/vehicles/VehicleCard";
import VehicleDialog from "../components/vehicles/VehicleDialog";

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
      setSelectedVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDialogOpen(false);
      setSelectedVehicle(null);
    },
  });

  const handleSave = (data) => {
    if (selectedVehicle) {
      updateMutation.mutate({ id: selectedVehicle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.plate?.toLowerCase().includes(search.toLowerCase()) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Vehículos" 
          description="Gestiona tu flota de vehículos"
          actions={
            <Button 
              onClick={() => { setSelectedVehicle(null); setDialogOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Vehículo
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por matrícula, marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="maintenance">En mantenimiento</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="car">Auto</SelectItem>
              <SelectItem value="truck">Camión</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="motorcycle">Moto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(vehicle => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                onClick={() => handleEdit(vehicle)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Car}
            title="Sin vehículos"
            description={search ? "No se encontraron vehículos con esos criterios" : "Agrega tu primer vehículo para comenzar"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Vehículo
                </Button>
              )
            }
          />
        )}

        <VehicleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vehicle={selectedVehicle}
          drivers={drivers}
          onSave={handleSave}
          onDelete={selectedVehicle ? () => deleteMutation.mutate(selectedVehicle.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
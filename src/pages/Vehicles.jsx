import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Car, Building2, MapPin } from "lucide-react";
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
  const [locationFilter, setLocationFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !currentUser?.company_id;

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const locationsMap = locations.reduce((acc, l) => ({ ...acc, [l.id]: l }), {});
  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

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

  // Filtrar por empresa del usuario si no es super admin
  const accessibleVehicles = isSuperAdmin 
    ? vehicles 
    : vehicles.filter(v => v.company_id === currentUser?.company_id);

  // Locaciones accesibles
  const accessibleLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.company_id === currentUser?.company_id);

  const filteredVehicles = accessibleVehicles.filter(v => {
    const matchesSearch = 
      v.plate?.toLowerCase().includes(search.toLowerCase()) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesLocation = locationFilter === "all" || v.location_id === locationFilter;
    const matchesCompany = companyFilter === "all" || v.company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesLocation && matchesCompany;
  });

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Vehículos" 
          description="Gestiona tu flota de vehículos"
          actions={
            accessibleLocations.length > 0 && (
              <Button 
                onClick={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Vehículo
              </Button>
            )
          }
        />

        {accessibleLocations.length === 0 && !isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-200">
              Debes crear al menos una locación antes de agregar vehículos.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por matrícula, marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          {isSuperAdmin && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Locación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {accessibleLocations.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                location={locationsMap[vehicle.location_id]}
                company={isSuperAdmin ? companiesMap[vehicle.company_id] : null}
                drivers={drivers}
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
              !search && accessibleLocations.length > 0 && (
                <Button 
                  onClick={() => { setSelectedVehicle(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
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
          drivers={drivers.filter(d => isSuperAdmin || d.company_id === currentUser?.company_id)}
          locations={accessibleLocations}
          companies={companies}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={selectedVehicle ? () => deleteMutation.mutate(selectedVehicle.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
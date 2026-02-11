import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Car, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import LocationDialog from "../components/locations/LocationDialog";

const typeLabels = {
  hangar: "Hangar",
  torre: "Torre",
  obrador: "Obrador",
  deposito: "Depósito",
  base: "Base",
  oficina: "Oficina",
  taller: "Taller",
  otro: "Otro",
};

export default function Locations() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !currentUser?.company_id;

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Location.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Location.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDialogOpen(false);
      setSelectedLocation(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Location.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDialogOpen(false);
      setSelectedLocation(null);
    },
  });

  const handleSave = (data) => {
    // Si es admin de empresa, asignar su company_id automáticamente
    const finalData = isSuperAdmin ? data : { ...data, company_id: currentUser?.company_id };
    
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setDialogOpen(true);
  };

  const getVehicleCount = (locationId) => {
    return vehicles.filter(v => v.location_id === locationId).length;
  };

  const canDeleteLocation = (locationId) => {
    return vehicles.filter(v => v.location_id === locationId).length === 0;
  };

  // Filtrar locaciones según rol
  const accessibleLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.company_id === currentUser?.company_id);

  const filteredLocations = accessibleLocations.filter(l => {
    const matchesSearch = 
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.address?.toLowerCase().includes(search.toLowerCase());
    const matchesCompany = companyFilter === "all" || l.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  // Empresas accesibles para el filtro
  const accessibleCompanies = isSuperAdmin 
    ? companies 
    : companies.filter(c => c.id === currentUser?.company_id);

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Locaciones" 
          description="Gestiona las locaciones de las empresas"
          actions={
            <Button 
              onClick={() => { setSelectedLocation(null); setDialogOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Locación
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          {isSuperAdmin && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {accessibleCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        ) : filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map(location => {
              const vehicleCount = getVehicleCount(location.id);
              const company = companiesMap[location.company_id];
              return (
                <div 
                  key={location.id}
                  onClick={() => handleEdit(location)}
                  className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 cursor-pointer transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    {location.image_url ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/20">
                        <img src={location.image_url} alt={location.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    <StatusBadge status={location.status} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">{location.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">{typeLabels[location.type] || location.type}</p>
                  
                  {isSuperAdmin && company && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <Building2 className="w-3 h-3" />
                      <span>{company.name}</span>
                    </div>
                  )}

                  {location.address && (
                    <p className="text-sm text-slate-500 mb-3 truncate">{location.address}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Car className="w-4 h-4" />
                    <span>{vehicleCount} vehículos</span>
                  </div>

                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="Sin locaciones"
            description={search ? "No se encontraron locaciones" : "Crea tu primera locación"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedLocation(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Locación
                </Button>
              )
            }
          />
        )}

        <LocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          location={selectedLocation}
          companies={accessibleCompanies}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={selectedLocation && canDeleteLocation(selectedLocation.id) ? () => deleteMutation.mutate(selectedLocation.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          hasVehicles={selectedLocation ? !canDeleteLocation(selectedLocation.id) : false}
        />
      </div>
    </div>
  );
}
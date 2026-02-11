import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Car, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import LocationDialog from "../components/locations/LocationDialog";
import { useTheme } from "../components/common/ThemeWrapper";

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
  const { theme } = useTheme();

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
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
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
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
            <Input
              placeholder="Buscar por nombre o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          {isSuperAdmin && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className={cn("w-full sm:w-52", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}>
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
              <Skeleton key={i} className={cn("h-48 rounded-2xl", theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200')} />
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
                  className={cn("group relative overflow-hidden rounded-2xl border p-6 cursor-pointer backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {location.image_url ? (
                    <div className="relative w-full h-32 rounded-xl mb-4 overflow-hidden border border-zinc-700">
                      <img src={location.image_url} alt={location.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/10 text-emerald-400 group-hover:from-emerald-500/20 group-hover:to-emerald-600/10 group-hover:border-emerald-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-emerald-500/5">
                        <MapPin className="w-10 h-10" />
                      </div>
                    </div>
                  )}
                  
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={cn("text-xl font-black mb-1", theme === 'dark' ? 'text-white bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent' : 'text-gray-900')}>{location.name}</h3>
                      <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-zinc-600' : 'text-gray-500')}>{typeLabels[location.type] || location.type}</p>
                    </div>
                    <StatusBadge status={location.status} />
                  </div>
                  
                  {isSuperAdmin && company && (
                    <div className="relative mb-3 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 w-fit">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-white">{company.name}</span>
                      </div>
                    </div>
                  )}

                  {location.address && (
                    <p className={cn("text-sm mb-3 font-medium truncate", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{location.address}</p>
                  )}
                  
                  <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 w-fit">
                    <Car className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-white">{vehicleCount}</span>
                    <span className="text-xs text-zinc-500">vehículos</span>
                  </div>

                  <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
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
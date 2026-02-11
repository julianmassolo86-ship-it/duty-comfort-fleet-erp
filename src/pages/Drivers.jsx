import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import DriverCard from "../components/drivers/DriverCard";
import DriverDialog from "../components/drivers/DriverDialog";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Drivers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !currentUser?.company_id;

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Driver.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
      setSelectedDriver(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialogOpen(false);
      setSelectedDriver(null);
    },
  });

  const handleSave = (data) => {
    // Si es admin de empresa, asignar su company_id automáticamente
    const finalData = isSuperAdmin ? data : { ...data, company_id: currentUser?.company_id };
    
    if (selectedDriver) {
      updateMutation.mutate({ id: selectedDriver.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setDialogOpen(true);
  };

  // Filtrar drivers según rol
  const accessibleDrivers = isSuperAdmin 
    ? drivers 
    : drivers.filter(d => d.company_id === currentUser?.company_id);

  const filteredDrivers = accessibleDrivers.filter(d => {
    const matchesSearch = 
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_id?.toLowerCase().includes(search.toLowerCase()) ||
      d.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Conductores" 
          description="Gestiona tu equipo de conductores"
          actions={
            <Button 
              onClick={() => { setSelectedDriver(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Conductor
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
            <Input
              placeholder="Buscar por nombre, documento o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-40", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900')}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="on_leave">De baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Drivers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-56 rounded-2xl", theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200')} />
            ))}
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map(driver => (
              <DriverCard 
                key={driver.id} 
                driver={driver} 
                onClick={() => handleEdit(driver)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Sin conductores"
            description={search ? "No se encontraron conductores con esos criterios" : "Agrega tu primer conductor para comenzar"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedDriver(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Conductor
                </Button>
              )
            }
          />
        )}

        <DriverDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          driver={selectedDriver}
          onSave={handleSave}
          onDelete={selectedDriver ? () => deleteMutation.mutate(selectedDriver.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          companies={companies}
          locations={locations}
          vehicles={vehicles}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
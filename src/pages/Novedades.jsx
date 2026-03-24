import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Car, Clock, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import NovedadDialog from "@/components/novedades/NovedadDialog";

const PRIORIDAD_CONFIG = {
  baja: { label: "Baja", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  media: { label: "Media", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  alta: { label: "Alta", cls: "bg-orange-500/10 text-orange-400 border border-orange-500/20" },
  critica: { label: "Crítica", cls: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", cls: "bg-yellow-500/10 text-yellow-500" },
  en_proceso: { label: "En Proceso", cls: "bg-blue-500/10 text-blue-400" },
  resuelto: { label: "Resuelto", cls: "bg-green-500/10 text-green-400" },
  cerrado: { label: "Cerrado", cls: "bg-gray-500/10 text-gray-400" },
};

export default function Novedades() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterPrioridad, setFilterPrioridad] = useState("all");
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: novedades = [], isLoading } = useQuery({
    queryKey: ["novedades"],
    queryFn: () => base44.entities.Novedad.list("-fecha_reporte"),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const accessibleNovedades = isSuperAdmin
    ? novedades
    : novedades.filter(n => n.company_id === currentUser?.company_id);

  const filtered = accessibleNovedades.filter(n => {
    const vehicle = vehicles.find(v => v.id === n.vehicle_id);
    const location = locations.find(l => l.id === n.location_id);
    const matchSearch = !search ||
      n.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle?.internal_number?.toLowerCase().includes(search.toLowerCase()) ||
      location?.name?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === "all" || n.estado === filterEstado;
    const matchPrioridad = filterPrioridad === "all" || n.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getLocation = (id) => locations.find(l => l.id === id);
  const getCompany = (id) => companies.find(c => c.id === id);

  const handleSave = async (data) => {
    if (selectedNovedad) {
      await base44.entities.Novedad.update(selectedNovedad.id, data);
    } else {
      await base44.entities.Novedad.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["novedades"] });
    setShowDialog(false);
    setSelectedNovedad(null);
  };

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === "dark" ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Novedades"
          description="Gestión de novedades reportadas"
          actions={
            <Button onClick={() => { setSelectedNovedad(null); setShowDialog(true); }}>
              + Nueva Novedad
            </Button>
          }
        />

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descripción, vehículo, ubicación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-zinc-600" : "text-gray-300")} />
            <p className={cn("text-sm", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
              No se encontraron novedades
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => {
              const vehicle = getVehicle(n.vehicle_id);
              const location = getLocation(n.location_id);
              const company = getCompany(n.company_id);
              const prioridad = PRIORIDAD_CONFIG[n.prioridad] || PRIORIDAD_CONFIG.media;
              const estado = ESTADO_CONFIG[n.estado] || ESTADO_CONFIG.pendiente;

              return (
                <div
                  key={n.id}
                  onClick={() => { setSelectedNovedad(n); setShowDialog(true); }}
                  className={cn(
                    "rounded-xl border p-4 cursor-pointer transition-all",
                    theme === "dark"
                      ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-600"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("font-medium flex-1", theme === "dark" ? "text-white" : "text-gray-900")}>
                      {n.descripcion}
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prioridad.cls)}>{prioridad.label}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", estado.cls)}>{estado.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {company && (
                      <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        <Building2 className="w-3 h-3" /> {company.name}
                      </span>
                    )}
                    {location && (
                      <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        <MapPin className="w-3 h-3" /> {location.name}
                      </span>
                    )}
                    {vehicle && (
                      <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                        <Car className="w-3 h-3" /> {vehicle.internal_number || vehicle.plate || `${vehicle.manufacturer} ${vehicle.model}`}
                      </span>
                    )}
                    {n.kilometraje_reportado && (
                      <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                        {n.kilometraje_reportado.toLocaleString()} km
                      </span>
                    )}
                    {n.horas_reportadas && (
                      <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                        {n.horas_reportadas} hs
                      </span>
                    )}
                    <span className={cn("flex items-center gap-1 text-xs ml-auto", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                      <Clock className="w-3 h-3" />
                      {n.fecha_reporte ? format(new Date(n.fecha_reporte + "T00:00:00"), "dd/MM/yyyy") : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NovedadDialog
        open={showDialog}
        onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedNovedad(null); }}
        novedad={selectedNovedad}
        onSave={handleSave}
      />
    </div>
  );
}
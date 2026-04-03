import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Car, Building2, MapPin, Clock, AlertTriangle, X } from "lucide-react";
import { format } from "date-fns";

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

function exportToCSV(data, vehicles, locations, companies) {
  const headers = [
    "Nro. Informe", "Fecha Reporte", "Fecha Resolución", "Estado", "Prioridad",
    "Descripción", "Detalles Resolución", "Vehículo (Interno)", "Patente",
    "Marca/Modelo", "Km Reportado", "Horas Reportadas", "Empresa", "Locación"
  ];

  const rows = data.map(n => {
    const v = vehicles.find(x => x.id === n.vehicle_id);
    const l = locations.find(x => x.id === n.location_id);
    const c = companies.find(x => x.id === n.company_id);
    return [
      n.report_number || "",
      n.fecha_reporte || "",
      n.fecha_resolucion || "",
      ESTADO_CONFIG[n.estado]?.label || n.estado || "",
      PRIORIDAD_CONFIG[n.prioridad]?.label || n.prioridad || "",
      `"${(n.descripcion || "").replace(/"/g, '""')}"`,
      `"${(n.detalles_resolucion || "").replace(/"/g, '""')}"`,
      v?.internal_number || "",
      v?.plate || "",
      v ? `${v.manufacturer || ""} ${v.model || ""}`.trim() : "",
      n.kilometraje_reportado || "",
      n.horas_reportadas || "",
      c?.name || "",
      l?.name || "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `novedades_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NovedadesHistorial({ novedades, vehicles, locations, companies, vehicleTypes, onEdit, isLoading }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterPrioridad, setFilterPrioridad] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const activeFiltersCount = [
    filterEstado !== "all", filterPrioridad !== "all", filterVehicle !== "all",
    filterLocation !== "all", filterCompany !== "all", !!fechaDesde, !!fechaHasta
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterEstado("all"); setFilterPrioridad("all"); setFilterVehicle("all");
    setFilterLocation("all"); setFilterCompany("all"); setFechaDesde(""); setFechaHasta(""); setSearch("");
  };

  const filtered = useMemo(() => {
    return novedades.filter(n => {
      const vehicle = vehicles.find(v => v.id === n.vehicle_id);
      const location = locations.find(l => l.id === n.location_id);
      const matchSearch = !search ||
        n.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        n.report_number?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.internal_number?.toLowerCase().includes(search.toLowerCase()) ||
        location?.name?.toLowerCase().includes(search.toLowerCase());
      const matchEstado = filterEstado === "all" || n.estado === filterEstado;
      const matchPrioridad = filterPrioridad === "all" || n.prioridad === filterPrioridad;
      const matchVehicle = filterVehicle === "all" || n.vehicle_id === filterVehicle;
      const matchLocation = filterLocation === "all" || n.location_id === filterLocation;
      const matchCompany = filterCompany === "all" || n.company_id === filterCompany;
      const matchDesde = !fechaDesde || n.fecha_reporte >= fechaDesde;
      const matchHasta = !fechaHasta || n.fecha_reporte <= fechaHasta;
      return matchSearch && matchEstado && matchPrioridad && matchVehicle && matchLocation && matchCompany && matchDesde && matchHasta;
    });
  }, [novedades, vehicles, locations, search, filterEstado, filterPrioridad, filterVehicle, filterLocation, filterCompany, fechaDesde, fechaHasta]);

  if (isLoading) return (
    <div className="text-center py-12">
      <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
    </div>
  );

  return (
    <div>
      {/* Filtros */}
      <div className={cn("rounded-xl border p-4 mb-5", theme === "dark" ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
        {/* Fila 1: búsqueda + exportar */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descripción, patente, interno, nro. informe..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => exportToCSV(filtered, vehicles, locations, companies)}
            className={cn("gap-2 shrink-0", theme === "dark" ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "")}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Fila 2: filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-36">
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
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Vehículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vehículos</SelectItem>
              {vehicles.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.internal_number ? `Interno ${v.internal_number}` : ""} {v.plate || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {locations.length > 0 && (
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Locación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las locaciones</SelectItem>
                {locations.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {companies.length > 0 && (
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            placeholder="Desde"
            className={cn(
              "h-10 rounded-md border px-3 text-sm w-36",
              theme === "dark" ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-200 text-gray-900"
            )}
          />
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            placeholder="Hasta"
            className={cn(
              "h-10 rounded-md border px-3 text-sm w-36",
              theme === "dark" ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-200 text-gray-900"
            )}
          />
        </div>

        {/* Contador */}
        <div className={cn("mt-3 text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
          {filtered.length} novedad{filtered.length !== 1 ? "es" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          {activeFiltersCount > 0 && <span className="ml-2 text-yellow-500">· {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo{activeFiltersCount !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-zinc-600" : "text-gray-300")} />
          <p className={cn("text-sm", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>No se encontraron novedades</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const vehicle = vehicles.find(v => v.id === n.vehicle_id);
            const location = locations.find(l => l.id === n.location_id);
            const company = companies.find(c => c.id === n.company_id);
            const vehicleType = vehicle ? vehicleTypes.find(t => t.id === vehicle.type_id) : null;
            const prioridad = PRIORIDAD_CONFIG[n.prioridad] || PRIORIDAD_CONFIG.media;
            const estado = ESTADO_CONFIG[n.estado] || ESTADO_CONFIG.pendiente;

            return (
              <div
                key={n.id}
                onClick={() => onEdit(n)}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all",
                  theme === "dark"
                    ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-600"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  {vehicle && (
                    <div className="shrink-0">
                      {vehicle.image_url ? (
                        <img src={vehicle.image_url} alt={vehicle.plate} className="w-14 h-14 rounded-lg object-cover border" style={{ borderColor: theme === "dark" ? "rgb(63,63,70)" : "rgb(229,231,235)" }} />
                      ) : (
                        <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border", theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200")}>
                          <Car className={cn("w-6 h-6", theme === "dark" ? "text-zinc-600" : "text-gray-400")} />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {n.report_number && (
                          <span className={cn("text-xs font-mono mr-2", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>#{n.report_number}</span>
                        )}
                        <span className={cn("font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>{n.descripcion}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {n.prioridad && <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prioridad.cls)}>{prioridad.label}</span>}
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", estado.cls)}>{estado.label}</span>
                      </div>
                    </div>
                    {vehicle && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className={cn("text-xs font-medium", theme === "dark" ? "text-zinc-300" : "text-gray-700")}>
                          {vehicle.internal_number && `Interno ${vehicle.internal_number}`}
                        </span>
                        <span className={cn("text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}>
                          {vehicle.manufacturer} {vehicle.model}
                        </span>
                        {vehicleType && <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>{vehicleType.name}</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      {company && <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}><Building2 className="w-3 h-3" /> {company.name}</span>}
                      {location && <span className={cn("flex items-center gap-1 text-xs", theme === "dark" ? "text-zinc-400" : "text-gray-500")}><MapPin className="w-3 h-3" /> {location.name}</span>}
                      {n.kilometraje_reportado && <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>{n.kilometraje_reportado.toLocaleString()} km</span>}
                      {n.horas_reportadas && <span className={cn("text-xs", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>{n.horas_reportadas} hs</span>}
                      <span className={cn("flex items-center gap-1 text-xs ml-auto", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                        <Clock className="w-3 h-3" />
                        {n.fecha_reporte ? format(new Date(n.fecha_reporte + "T00:00:00"), "dd/MM/yyyy") : "-"}
                      </span>
                    </div>
                    {n.detalles_resolucion && (
                      <p className={cn("text-xs mt-1.5 italic", theme === "dark" ? "text-zinc-500" : "text-gray-400")}>
                        Resolución: {n.detalles_resolucion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
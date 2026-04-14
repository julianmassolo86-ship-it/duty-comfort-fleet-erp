import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Car, Building2, MapPin, Clock, Wrench, X, Package } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  scheduled:   { label: "Programado",  cls: "bg-yellow-500/10 text-yellow-500" },
  in_progress: { label: "En Progreso", cls: "bg-blue-500/10 text-blue-400" },
  completed:   { label: "Completado",  cls: "bg-green-500/10 text-green-400" },
  cancelled:   { label: "Cancelado",   cls: "bg-gray-500/10 text-gray-400" },
};

function exportToCSV(data, vehicles, locations, companies) {
  const headers = [
    "Nro. Informe", "Fecha Completado", "Estado", "Descripción",
    "Vehículo (Interno)", "Patente", "Marca/Modelo",
    "Proveedor", "Costo", "Repuestos", "Empresa", "Locación"
  ];

  const rows = data.map(c => {
    const v = vehicles.find(x => x.id === c.vehicle_id);
    const l = locations.find(x => x.id === c.location_id);
    const comp = companies.find(x => x.id === c.company_id);
    const parts = (c.spare_parts_used || []).map(p => `${p.spare_part_name} x${p.quantity}`).join("; ");
    return [
      c.report_number || "",
      c.completed_date || "",
      STATUS_CONFIG[c.status]?.label || c.status || "",
      `"${(c.description || "").replace(/"/g, '""')}"`,
      v?.internal_number || "",
      v?.plate || "",
      v ? `${v.manufacturer || ""} ${v.model || ""}`.trim() : "",
      c.provider || "",
      c.cost || "",
      `"${parts}"`,
      comp?.name || "",
      l?.name || "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `correctivos_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CorrectivosHistorial({ correctivos, vehicles, locations, companies, onEdit, isLoading }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const activeFiltersCount = [
    filterStatus !== "all", filterVehicle !== "all", filterLocation !== "all",
    filterCompany !== "all", !!fechaDesde, !!fechaHasta
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus("all"); setFilterVehicle("all"); setFilterLocation("all");
    setFilterCompany("all"); setFechaDesde(""); setFechaHasta(""); setSearch("");
  };

  const filtered = useMemo(() => {
    return correctivos.filter(c => {
      const vehicle = vehicles.find(v => v.id === c.vehicle_id);
      const matchSearch = !search ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.report_number?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle?.internal_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.provider?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      const matchVehicle = filterVehicle === "all" || c.vehicle_id === filterVehicle;
      const matchLocation = filterLocation === "all" || c.location_id === filterLocation;
      const matchCompany = filterCompany === "all" || c.company_id === filterCompany;
      const dateRef = c.completed_date || c.scheduled_date || "";
      const matchDesde = !fechaDesde || dateRef >= fechaDesde;
      const matchHasta = !fechaHasta || dateRef <= fechaHasta;
      return matchSearch && matchStatus && matchVehicle && matchLocation && matchCompany && matchDesde && matchHasta;
    });
  }, [correctivos, vehicles, search, filterStatus, filterVehicle, filterLocation, filterCompany, fechaDesde, fechaHasta]);

  if (isLoading) return (
    <div className="text-center py-12">
      <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
    </div>
  );

  return (
    <div>
      {/* Filtros */}
      <div className={cn("rounded-xl border p-4 mb-5", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200")}>
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descripción, patente, interno, proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => exportToCSV(filtered, vehicles, locations, companies)}
            className={cn("gap-2 shrink-0", isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "")}
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

        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
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
            type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            className={cn("h-10 rounded-md border px-3 text-sm w-36", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-200 text-gray-900")}
          />
          <input
            type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            className={cn("h-10 rounded-md border px-3 text-sm w-36", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-200 text-gray-900")}
          />
        </div>

        <div className={cn("mt-3 text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>
          {filtered.length} correctivo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          {activeFiltersCount > 0 && <span className="ml-2 text-yellow-500">· {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo{activeFiltersCount !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-zinc-600" : "text-gray-300")} />
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>No se encontraron correctivos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const vehicle = vehicles.find(v => v.id === c.vehicle_id);
            const location = locations.find(l => l.id === c.location_id);
            const company = companies.find(comp => comp.id === c.company_id);
            const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.scheduled;

            return (
              <div
                key={c.id}
                onClick={() => onEdit(c)}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all",
                  isDark
                    ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-600"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {vehicle?.image_url ? (
                      <img src={vehicle.image_url} alt={vehicle.plate} className="w-14 h-14 rounded-lg object-cover border" style={{ borderColor: isDark ? "rgb(63,63,70)" : "rgb(229,231,235)" }} />
                    ) : (
                      <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200")}>
                        <Car className={cn("w-6 h-6", isDark ? "text-zinc-600" : "text-gray-400")} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {c.report_number && (
                          <span className={cn("text-xs font-mono mr-2", isDark ? "text-zinc-500" : "text-gray-400")}>#{c.report_number}</span>
                        )}
                        <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{c.description}</span>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", status.cls)}>{status.label}</span>
                    </div>

                    {vehicle && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {vehicle.internal_number && (
                          <span className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-gray-700")}>Interno {vehicle.internal_number}</span>
                        )}
                        <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{vehicle.plate}</span>
                        <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-gray-400")}>{vehicle.manufacturer} {vehicle.model}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      {company && <span className={cn("flex items-center gap-1 text-xs", isDark ? "text-zinc-400" : "text-gray-500")}><Building2 className="w-3 h-3" />{company.name}</span>}
                      {location && <span className={cn("flex items-center gap-1 text-xs", isDark ? "text-zinc-400" : "text-gray-500")}><MapPin className="w-3 h-3" />{location.name}</span>}
                      {c.provider && <span className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>{c.provider}</span>}
                      {c.cost > 0 && <span className={cn("text-xs font-medium text-green-500")}>${c.cost.toLocaleString()}</span>}
                      {c.spare_parts_used?.length > 0 && (
                        <span className={cn("flex items-center gap-1 text-xs font-medium", isDark ? "text-orange-400" : "text-orange-600")}>
                          <Package className="w-3 h-3" />{c.spare_parts_used.length} repuesto{c.spare_parts_used.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className={cn("flex items-center gap-1 text-xs ml-auto", isDark ? "text-zinc-500" : "text-gray-400")}>
                        <Clock className="w-3 h-3" />
                        {c.completed_date
                          ? format(new Date(c.completed_date + "T00:00:00"), "dd/MM/yyyy")
                          : c.scheduled_date
                          ? format(new Date(c.scheduled_date + "T00:00:00"), "dd/MM/yyyy")
                          : "-"}
                      </span>
                    </div>

                    {/* Detalle de repuestos estructurados */}
                    {c.spare_parts_used?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.spare_parts_used.map((part, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border",
                              isDark
                                ? "bg-orange-500/10 border-orange-500/20 text-orange-300"
                                : "bg-orange-50 border-orange-200 text-orange-700"
                            )}
                          >
                            <Package className="w-2.5 h-2.5" />
                            {part.spare_part_name}
                            {part.quantity > 1 && <span className="font-medium">×{part.quantity}</span>}
                            {part.unit_cost > 0 && (
                              <span className={cn("font-medium", isDark ? "text-green-400" : "text-green-600")}>
                                ${(part.unit_cost * part.quantity).toLocaleString()}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Fallback: campo parts_replaced (texto libre, registros viejos) */}
                    {!c.spare_parts_used?.length && c.parts_replaced && (
                      <div className="mt-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border",
                          isDark
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-300"
                            : "bg-orange-50 border-orange-200 text-orange-700"
                        )}>
                          <Package className="w-2.5 h-2.5" />
                          {c.parts_replaced}
                        </span>
                      </div>
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
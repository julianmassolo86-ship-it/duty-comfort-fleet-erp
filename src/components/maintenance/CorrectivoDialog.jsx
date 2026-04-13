import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, Car, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { format } from "date-fns";
import SparePartsSelector from "@/components/maintenance/SparePartsSelector";

export default function CorrectivoDialog({ open, onOpenChange, initialNovedad, onSuccess }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState("novedad"); // "novedad" | "vehiculo"
  const [novedad, setNovedad] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleNovedades, setVehicleNovedades] = useState([]);
  const [selectedNovedadId, setSelectedNovedadId] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [form, setForm] = useState({ fecha: format(new Date(), "yyyy-MM-dd"), km: "", horas: "", millas: "", descripcion_solucion: "" });
  const [spareParts, setSpareParts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && initialNovedad) {
      loadNovedadWithVehicle(initialNovedad);
    } else if (open && !initialNovedad) {
      resetAll();
    }
  }, [open, initialNovedad]);

  const resetAll = () => {
    setSearchTerm("");
    setNovedad(null);
    setVehicle(null);
    setVehicleNovedades([]);
    setSelectedNovedadId(null);
    setSearchError("");
    setError("");
    setForm({ fecha: format(new Date(), "yyyy-MM-dd"), km: "", horas: "", millas: "", descripcion_solucion: "" });
    setSpareParts([]);
  };

  const loadNovedadWithVehicle = async (nov) => {
    setNovedad(nov);
    setSelectedNovedadId(nov.id);
    if (nov.vehicle_id) {
      const v = await base44.entities.Vehicle.filter({ id: nov.vehicle_id });
      if (v.length > 0) {
        setVehicle(v[0]);
        setForm(prev => ({ ...prev, km: v[0].mileage || "", horas: v[0].hours || "" }));
      }
    }
  };

  const handleSearch = async () => {
    setSearchError("");
    setSearching(true);
    try {
      if (searchMode === "novedad") {
        const results = await base44.entities.Novedad.list();
        const found = results.find(n =>
          n.report_number?.toLowerCase() === searchTerm.toLowerCase().trim() ||
          n.report_number?.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
        if (!found) { setSearchError("No se encontró ninguna novedad con ese número."); setSearching(false); return; }
        if (found.estado === "resuelto" || found.estado === "cerrado") {
          setSearchError(`Esta novedad ya está ${found.estado === "resuelto" ? "resuelta" : "cerrada"}.`);
          setSearching(false); return;
        }
        await loadNovedadWithVehicle(found);
        setVehicleNovedades([]);
      } else {
        const vehicles = await base44.entities.Vehicle.list();
        const v = vehicles.find(veh =>
          veh.internal_number?.toLowerCase() === searchTerm.toLowerCase().trim() ||
          veh.internal_number?.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
        if (!v) { setSearchError("No se encontró ningún vehículo con ese número interno."); setSearching(false); return; }
        setVehicle(v);
        setForm(prev => ({ ...prev, km: v.mileage || "", horas: v.hours || "" }));
        const novedades = await base44.entities.Novedad.filter({ vehicle_id: v.id });
        const pendientes = novedades.filter(n => n.estado !== "resuelto" && n.estado !== "cerrado");
        setVehicleNovedades(pendientes);
        setNovedad(null);
        setSelectedNovedadId(null);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNovedad = (n) => {
    setNovedad(n);
    setSelectedNovedadId(n.id);
  };

  const handleSave = async () => {
    setError("");
    if (!novedad) { setError("Debe seleccionar una novedad a resolver."); return; }
    if (!form.descripcion_solucion.trim()) { setError("Debe describir la solución aplicada."); return; }
    if (!form.fecha) { setError("Debe ingresar la fecha de realización."); return; }

    setSaving(true);
    try {
      const now = new Date();
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Crear registro de mantenimiento correctivo
      const maintenanceData = {
        vehicle_id: novedad.vehicle_id,
        company_id: novedad.company_id,
        location_id: novedad.location_id,
        type: "corrective",
        status: "completed",
        description: form.descripcion_solucion,
        completed_date: form.fecha,
        completed_time: hora,
        novedad_id: novedad.id,
        novedad_report_number: novedad.report_number,
        spare_parts_used: spareParts,
        notes: `Resolución de novedad #${novedad.report_number || ""}: ${novedad.descripcion}`,
      };
      if (form.km) maintenanceData.mileage_at_service = parseFloat(form.km);
      if (form.millas) maintenanceData.miles_at_service = parseFloat(form.millas);
      if (form.horas) maintenanceData.hours_at_service = parseFloat(form.horas);

      const created = await base44.entities.Maintenance.create(maintenanceData);

      // Actualizar novedad a "resuelto"
      await base44.entities.Novedad.update(novedad.id, {
        estado: "resuelto",
        fecha_resolucion: form.fecha,
        detalles_resolucion: form.descripcion_solucion,
        correctivo_maintenance_id: created.id,
      });

      // Actualizar km/horas/millas del vehículo
      const vehicleUpdate = {};
      if (form.km) vehicleUpdate.mileage = parseFloat(form.km);
      if (form.millas) vehicleUpdate.miles = parseFloat(form.millas);
      if (form.horas) vehicleUpdate.hours = parseFloat(form.horas);
      if (Object.keys(vehicleUpdate).length > 0) {
        await base44.entities.Vehicle.update(novedad.vehicle_id, vehicleUpdate);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-yellow-500" />
            Mantenimiento Correctivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Búsqueda */}
          {!initialNovedad && (
            <div className={cn("p-4 rounded-lg border space-y-3", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200")}>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSearchMode("novedad"); resetAll(); }}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", searchMode === "novedad"
                    ? "bg-yellow-500 text-black" : isDark ? "bg-zinc-700 text-zinc-300" : "bg-white text-gray-600 border border-gray-200")}
                >
                  Buscar por Nro. Solicitud
                </button>
                <button
                  onClick={() => { setSearchMode("vehiculo"); resetAll(); }}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", searchMode === "vehiculo"
                    ? "bg-yellow-500 text-black" : isDark ? "bg-zinc-700 text-zinc-300" : "bg-white text-gray-600 border border-gray-200")}
                >
                  Buscar por Interno
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder={searchMode === "novedad" ? "Número de solicitud/novedad..." : "Número interno del vehículo..."}
                    className={cn("pl-9", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")}
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching || !searchTerm.trim()} variant="outline"
                  className={isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : ""}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                </Button>
              </div>
              {searchError && <p className="text-xs text-red-500">{searchError}</p>}
            </div>
          )}

          {/* Lista de novedades del vehículo (modo interno) */}
          {vehicleNovedades.length > 0 && (
            <div className="space-y-2">
              <Label>Novedades pendientes del vehículo:</Label>
              {vehicleNovedades.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleSelectNovedad(n)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedNovedadId === n.id
                      ? "border-yellow-500 bg-yellow-500/10"
                      : isDark ? "border-zinc-700 bg-zinc-800 hover:border-zinc-500" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {n.report_number && <span className={cn("text-xs font-mono", isDark ? "text-zinc-400" : "text-gray-400")}>#{n.report_number}</span>}
                    <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{n.descripcion}</span>
                    <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full", n.prioridad === "critica" ? "bg-red-500/10 text-red-400" : n.prioridad === "alta" ? "bg-orange-500/10 text-orange-400" : "bg-yellow-500/10 text-yellow-500")}>
                      {n.prioridad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Datos del vehículo y novedad seleccionada */}
          {vehicle && (
            <div className={cn("p-3 rounded-lg border flex items-center gap-3", isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200")}>
              {vehicle.image_url ? (
                <img src={vehicle.image_url} alt={vehicle.plate} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", isDark ? "bg-zinc-700" : "bg-gray-200")}>
                  <Car className={cn("w-6 h-6", isDark ? "text-zinc-400" : "text-gray-400")} />
                </div>
              )}
              <div>
                <p className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  {vehicle.internal_number && `Interno ${vehicle.internal_number}`}{vehicle.plate && ` · ${vehicle.plate}`}
                </p>
                <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>{vehicle.manufacturer} {vehicle.model}</p>
                <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-500" : "text-gray-400")}>
                  {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : ""}{vehicle.hours ? ` · ${vehicle.hours} hs` : ""}
                </p>
              </div>
            </div>
          )}

          {novedad && (
            <div className={cn("p-3 rounded-lg border", isDark ? "bg-amber-900/20 border-amber-800/40" : "bg-amber-50 border-amber-200")}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-xs font-medium", isDark ? "text-amber-400" : "text-amber-700")}>
                    Solicitud #{novedad.report_number}
                  </p>
                  <p className={cn("text-sm mt-0.5", isDark ? "text-zinc-200" : "text-gray-800")}>{novedad.descripcion}</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de solución */}
          {novedad && (
            <div className="space-y-4">
              <div className={cn("h-px", isDark ? "bg-zinc-800" : "bg-gray-200")} />
              <p className={cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-gray-700")}>Datos de la intervención:</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fecha *</Label>
                  <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)}
                    className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
                </div>
                <div className="space-y-1">
                  <Label>Kilometraje</Label>
                  <Input type="number" value={form.km} onChange={e => set("km", e.target.value)}
                    placeholder={vehicle?.mileage ? `Actual: ${vehicle.mileage}` : ""}
                    className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
                </div>
                <div className="space-y-1">
                  <Label>Horas</Label>
                  <Input type="number" value={form.horas} onChange={e => set("horas", e.target.value)}
                    placeholder={vehicle?.hours ? `Actual: ${vehicle.hours}` : ""}
                    className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
                </div>
                <div className="space-y-1">
                  <Label>Millas</Label>
                  <Input type="number" value={form.millas} onChange={e => set("millas", e.target.value)}
                    className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
                </div>
              </div>

              <SparePartsSelector
                companyId={novedad?.company_id}
                value={spareParts}
                onChange={setSpareParts}
                isDark={isDark}
              />

              <div className="space-y-1">
                <Label>Descripción de la Solución *</Label>
                <Textarea
                  value={form.descripcion_solucion}
                  onChange={e => set("descripcion_solucion", e.target.value)}
                  placeholder="Describa las acciones realizadas para resolver la novedad..."
                  rows={4}
                  className={isDark ? "bg-zinc-800 border-zinc-700" : ""}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}
            className={isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : ""}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !novedad}
            className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Resolver y Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import { format } from "date-fns";

export default function NuevaNovedadDialog({ open, onOpenChange, onSuccess }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [reportNumber, setReportNumber] = useState(null);
  const [form, setForm] = useState({
    descripcion: "",
    prioridad: "media",
    fecha_reporte: format(new Date(), "yyyy-MM-dd"),
    kilometraje_reportado: "",
    horas_reportadas: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && user) {
      loadData();
      generateReportNumber();
      setSelectedVehicle(null);
      setSearchTerm("");
      setCompanyFilter("all");
      setLocationFilter("all");
      setShowVehicleSelector(false);
      setForm({
        descripcion: "",
        prioridad: "media",
        fecha_reporte: format(new Date(), "yyyy-MM-dd"),
        kilometraje_reportado: "",
        horas_reportadas: "",
      });
      setError("");
    }
  }, [open, user]);

  const loadData = async () => {
    const [v, c, l] = await Promise.all([
      user?.company_id
        ? base44.entities.Vehicle.filter({ company_id: user.company_id })
        : base44.entities.Vehicle.list(),
      user?.company_id
        ? base44.entities.Company.filter({ id: user.company_id })
        : base44.entities.Company.list(),
      user?.company_id
        ? base44.entities.Location.filter({ company_id: user.company_id })
        : base44.entities.Location.list(),
    ]);
    setVehicles(v);
    setCompanies(c);
    setLocations(l);
  };

  const generateReportNumber = async () => {
    try {
      const res = await base44.functions.invoke("getNextReportNumber", {
        report_type: "novedad",
        company_id: user?.company_id || "global",
      });
      setReportNumber(res?.data?.report_number || null);
    } catch (e) {
      console.error("Error generating report number", e);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = !searchTerm ||
      v.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCompany = companyFilter === "all" || v.company_id === companyFilter;
    const matchLocation = locationFilter === "all" || v.location_id === locationFilter;
    return matchSearch && matchCompany && matchLocation;
  });

  const filteredLocations = locations.filter(l =>
    companyFilter === "all" || l.company_id === companyFilter
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedVehicle) { setError("Debe seleccionar un vehículo."); return; }
    if (!form.descripcion.trim()) { setError("Debe describir la novedad."); return; }

    setLoading(true);
    try {
      await base44.entities.Novedad.create({
        vehicle_id: selectedVehicle.id,
        company_id: selectedVehicle.company_id,
        location_id: selectedVehicle.location_id,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        fecha_reporte: form.fecha_reporte,
        estado: "pendiente",
        report_number: reportNumber,
        ...(form.kilometraje_reportado ? { kilometraje_reportado: parseFloat(form.kilometraje_reportado) } : {}),
        ...(form.horas_reportadas ? { horas_reportadas: parseFloat(form.horas_reportadas) } : {}),
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Nueva Solicitud de Novedad</span>
            {reportNumber && (
              <span className="text-sm font-mono px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                {reportNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Vehículo */}
          <div className="space-y-2">
            <Label>Vehículo *</Label>
            {selectedVehicle ? (
              <div className={cn("flex items-center justify-between p-3 rounded-lg border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200")}>
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    {selectedVehicle.internal_number && `Interno ${selectedVehicle.internal_number}`}{selectedVehicle.plate && ` · ${selectedVehicle.plate}`}
                  </p>
                  <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>{selectedVehicle.manufacturer} {selectedVehicle.model}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedVehicle(null)}
                  className={isDark ? "text-zinc-400 hover:text-white" : ""}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                className={cn("w-full justify-start", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white" : "")}>
                <Search className="w-4 h-4 mr-2" />
                Buscar vehículo...
              </Button>
            )}

            {showVehicleSelector && !selectedVehicle && (
              <div className={cn("border rounded-lg p-4 space-y-3", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200")}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Buscar por patente, número interno, marca..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className={cn("pl-10", isDark ? "bg-zinc-900 border-zinc-700 text-white" : "")} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className={isDark ? "bg-zinc-900 border-zinc-700 text-white" : ""}>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las empresas</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter} disabled={companyFilter === "all"}>
                    <SelectTrigger className={isDark ? "bg-zinc-900 border-zinc-700 text-white" : ""}>
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {filteredLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className={cn("max-h-56 overflow-y-auto rounded-lg border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200")}>
                  {filteredVehicles.length === 0 ? (
                    <p className={cn("p-4 text-sm text-center", isDark ? "text-zinc-400" : "text-gray-500")}>No se encontraron vehículos</p>
                  ) : filteredVehicles.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setShowVehicleSelector(false); setSearchTerm(""); }}
                      className={cn("w-full text-left p-3 transition-colors border-b last:border-b-0",
                        isDark ? "hover:bg-zinc-800 border-zinc-700" : "hover:bg-gray-50 border-gray-100")}>
                      <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {v.internal_number} - {v.plate}
                      </p>
                      <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>{v.manufacturer} {v.model}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción de la Novedad *</Label>
            <Textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Ej: Lámpara trasera derecha quemada, ruido en motor..."
              rows={3}
              className={isDark ? "bg-zinc-800 border-zinc-700 text-white" : ""}
            />
          </div>

          {/* Prioridad y fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onValueChange={v => setForm(p => ({ ...p, prioridad: v }))}>
                <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Reporte</Label>
              <Input type="date" value={form.fecha_reporte}
                onChange={e => setForm(p => ({ ...p, fecha_reporte: e.target.value }))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>

          {/* Km / Horas opcionales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kilometraje (opcional)</Label>
              <Input type="number" value={form.kilometraje_reportado}
                onChange={e => setForm(p => ({ ...p, kilometraje_reportado: e.target.value }))}
                placeholder={selectedVehicle?.mileage ? `Actual: ${selectedVehicle.mileage}` : "km"}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
            <div className="space-y-2">
              <Label>Horas (opcional)</Label>
              <Input type="number" value={form.horas_reportadas}
                onChange={e => setForm(p => ({ ...p, horas_reportadas: e.target.value }))}
                placeholder={selectedVehicle?.hours ? `Actual: ${selectedVehicle.hours}` : "hs"}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}
              className={isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : ""}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Crear Novedad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
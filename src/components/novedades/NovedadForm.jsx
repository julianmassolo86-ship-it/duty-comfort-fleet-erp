import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function NovedadForm() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [form, setForm] = useState({
    kilometraje_reportado: "",
    horas_reportadas: "",
    fecha_reporte: format(new Date(), "yyyy-MM-dd"),
    descripcion: "",
    prioridad: "media",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: allVehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Determinar companyId efectivo
  const effectiveCompanyId = isSuperAdmin ? selectedCompanyId : currentUser?.company_id;

  const filteredLocations = allLocations.filter(
    (l) => l.company_id === effectiveCompanyId
  );

  const filteredVehicles = allVehicles.filter(
    (v) => v.location_id === selectedLocationId
  );

  const selectedVehicle = allVehicles.find((v) => v.id === selectedVehicleId);

  const handleCompanyChange = (val) => {
    setSelectedCompanyId(val);
    setSelectedLocationId("");
    setSelectedVehicleId("");
  };

  const handleLocationChange = (val) => {
    setSelectedLocationId(val);
    setSelectedVehicleId("");
  };

  const handleSave = async () => {
    if (!selectedVehicleId || !form.descripcion) return;
    setSaving(true);
    try {
      const locationId = selectedLocationId || selectedVehicle?.location_id;
      const companyId = effectiveCompanyId || selectedVehicle?.company_id;

      await base44.entities.Novedad.create({
        vehicle_id: selectedVehicleId,
        company_id: companyId,
        location_id: locationId,
        descripcion: form.descripcion,
        fecha_reporte: form.fecha_reporte,
        prioridad: form.prioridad,
        estado: "pendiente",
        kilometraje_reportado: form.kilometraje_reportado ? Number(form.kilometraje_reportado) : undefined,
        horas_reportadas: form.horas_reportadas ? Number(form.horas_reportadas) : undefined,
      });

      // Actualizar kilómetros y horas del vehículo si se ingresaron
      const updates = {};
      if (form.kilometraje_reportado) updates.mileage = Number(form.kilometraje_reportado);
      if (form.horas_reportadas) updates.hours = Number(form.horas_reportadas);
      if (Object.keys(updates).length > 0) {
        await base44.entities.Vehicle.update(selectedVehicleId, updates);
      }

      queryClient.invalidateQueries({ queryKey: ["novedades"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });

      // Reset form
      setForm({
        kilometraje_reportado: "",
        horas_reportadas: "",
        fecha_reporte: format(new Date(), "yyyy-MM-dd"),
        descripcion: "",
        prioridad: "media",
      });
      setSelectedVehicleId("");
      setSelectedLocationId("");
      if (isSuperAdmin) setSelectedCompanyId("");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const cardCls = cn(
    "rounded-2xl border p-6",
    theme === "dark" ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200"
  );
  const labelCls = cn("text-sm font-medium", theme === "dark" ? "text-zinc-300" : "text-gray-700");

  return (
    <div className={cardCls}>
      <h2 className={cn("text-lg font-bold mb-6", theme === "dark" ? "text-white" : "text-gray-900")}>
        Registrar Novedad
      </h2>

      <div className="space-y-5">
        {/* Selección de empresa (solo super admin) */}
        {isSuperAdmin && (
          <div className="space-y-1.5">
            <Label className={labelCls}>Empresa *</Label>
            <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selección de ubicación */}
        <div className="space-y-1.5">
          <Label className={labelCls}>Ubicación *</Label>
          <Select
            value={selectedLocationId}
            onValueChange={handleLocationChange}
            disabled={!effectiveCompanyId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación..." />
            </SelectTrigger>
            <SelectContent>
              {filteredLocations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selección de vehículo */}
        <div className="space-y-1.5">
          <Label className={labelCls}>Vehículo *</Label>
          <Select
            value={selectedVehicleId}
            onValueChange={setSelectedVehicleId}
            disabled={!selectedLocationId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vehículo..." />
            </SelectTrigger>
            <SelectContent>
              {filteredVehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.internal_number ? `[${v.internal_number}] ` : ""}{v.manufacturer} {v.model} {v.plate ? `- ${v.plate}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-1.5">
          <Label className={labelCls}>Fecha *</Label>
          <Input
            type="date"
            value={form.fecha_reporte}
            onChange={(e) => setForm({ ...form, fecha_reporte: e.target.value })}
          />
        </div>

        {/* Km y Horas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelCls}>Kilómetros</Label>
            <Input
              type="number"
              placeholder={selectedVehicle ? `Actual: ${selectedVehicle.mileage ?? "-"}` : "km actuales"}
              value={form.kilometraje_reportado}
              onChange={(e) => setForm({ ...form, kilometraje_reportado: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Horas</Label>
            <Input
              type="number"
              placeholder={selectedVehicle ? `Actual: ${selectedVehicle.hours ?? "-"}` : "horas actuales"}
              value={form.horas_reportadas}
              onChange={(e) => setForm({ ...form, horas_reportadas: e.target.value })}
            />
          </div>
        </div>

        {/* Prioridad */}
        <div className="space-y-1.5">
          <Label className={labelCls}>Prioridad</Label>
          <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
            <SelectTrigger>
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

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label className={labelCls}>Descripción de la Novedad *</Label>
          <Textarea
            placeholder="Describí la novedad o problema detectado..."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="min-h-[100px]"
          />
        </div>

        {/* Botón */}
        <Button
          onClick={handleSave}
          disabled={saving || !selectedVehicleId || !form.descripcion}
          className="w-full"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : success ? (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> ¡Novedad registrada!</>
          ) : (
            "Registrar Novedad"
          )}
        </Button>
      </div>
    </div>
  );
}
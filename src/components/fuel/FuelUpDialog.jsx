import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";

const fuelTypeLabels = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  gnc: "GNC",
  gnv: "GNV",
  biodiesel: "Biodiésel",
  ethanol: "Etanol",
  otro: "Otro",
};

const initialForm = {
  date: new Date().toISOString().split("T")[0],
  mileage: "",
  hours: "",
  fuel_quantity: "",
  price_per_unit: "",
  total_price: "",
  is_full_tank: false,
  fuel_type: "diesel",
  ticket_photo_url: "",
  notes: "",
};

export default function FuelUpDialog({ open, onOpenChange, vehicleId, companyId, locationId, vehicle, fuelUp, onSaved, vehicles = [], showVehicleSelector = false }) {
  const [form, setForm] = useState(initialForm);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedVehicleId(vehicleId || fuelUp?.vehicle_id || "");
      if (fuelUp) {
        setForm({ ...initialForm, ...fuelUp });
      } else {
        setForm({
          ...initialForm,
          fuel_type: vehicle?.fuel_type || "diesel",
          mileage: vehicle?.mileage || "",
          hours: vehicle?.hours || "",
        });
      }
    }
  }, [open, fuelUp, vehicle, vehicleId]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calcular precio total
      if (field === "fuel_quantity" || field === "price_per_unit") {
        const qty = parseFloat(field === "fuel_quantity" ? value : updated.fuel_quantity) || 0;
        const ppu = parseFloat(field === "price_per_unit" ? value : updated.price_per_unit) || 0;
        if (qty > 0 && ppu > 0) updated.total_price = (qty * ppu).toFixed(2);
      }
      return updated;
    });
  };

  const handleTicketUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, ticket_photo_url: result.file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const resolvedVehicleId = selectedVehicleId || vehicleId;
    const resolvedVehicle = vehicles.find(v => v.id === resolvedVehicleId) || vehicle;
    const data = {
      ...form,
      vehicle_id: resolvedVehicleId,
      company_id: companyId || resolvedVehicle?.company_id,
      location_id: locationId || resolvedVehicle?.location_id,
      mileage: form.mileage !== "" ? Number(form.mileage) : null,
      hours: form.hours !== "" ? Number(form.hours) : null,
      fuel_quantity: Number(form.fuel_quantity),
      price_per_unit: form.price_per_unit !== "" ? Number(form.price_per_unit) : null,
      total_price: Number(form.total_price),
    };
    if (fuelUp?.id) {
      await base44.entities.FuelUp.update(fuelUp.id, data);
    } else {
      await base44.entities.FuelUp.create(data);
    }
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fuelUp ? "Editar Carga" : "Nueva Carga de Combustible"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showVehicleSelector && vehicles.length > 0 && (
            <div className="space-y-2">
              <Label>Vehículo *</Label>
              <Select value={selectedVehicleId} onValueChange={v => {
                setSelectedVehicleId(v);
                const sel = vehicles.find(veh => veh.id === v);
                if (sel) {
                  setForm(prev => ({ ...prev, fuel_type: sel.fuel_type || prev.fuel_type, mileage: sel.mileage || prev.mileage, hours: sel.hours || prev.hours }));
                }
              }} required>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue placeholder="Seleccionar vehículo" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {`${v.internal_number || ''} ${v.plate || ''} - ${v.manufacturer} ${v.model}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={form.date} onChange={e => handleChange("date", e.target.value)} className="bg-zinc-900 border-zinc-700" required />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Combustible</Label>
              <Select value={form.fuel_type} onValueChange={v => handleChange("fuel_type", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(fuelTypeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kilometraje</Label>
              <Input type="number" value={form.mileage} onChange={e => handleChange("mileage", e.target.value)} className="bg-zinc-900 border-zinc-700" placeholder="km actuales" />
            </div>
            <div className="space-y-2">
              <Label>Horas</Label>
              <Input type="number" value={form.hours} onChange={e => handleChange("hours", e.target.value)} className="bg-zinc-900 border-zinc-700" placeholder="hs actuales" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Litros *</Label>
              <Input type="number" step="0.01" value={form.fuel_quantity} onChange={e => handleChange("fuel_quantity", e.target.value)} className="bg-zinc-900 border-zinc-700" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label>Precio/Litro</Label>
              <Input type="number" step="0.01" value={form.price_per_unit} onChange={e => handleChange("price_per_unit", e.target.value)} className="bg-zinc-900 border-zinc-700" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Total *</Label>
              <Input type="number" step="0.01" value={form.total_price} onChange={e => handleChange("total_price", e.target.value)} className="bg-zinc-900 border-zinc-700" placeholder="0.00" required />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <Switch checked={form.is_full_tank} onCheckedChange={v => handleChange("is_full_tank", v)} />
            <div>
              <p className="text-sm font-medium">Tanque Lleno</p>
              <p className="text-xs text-zinc-500">Necesario para calcular el consumo</p>
            </div>
          </div>

          {/* Ticket Upload */}
          <div className="space-y-2">
            <Label>Foto del Ticket</Label>
            {form.ticket_photo_url ? (
              <div className="relative">
                <img src={form.ticket_photo_url} alt="Ticket" className="w-full h-32 object-contain rounded-lg border border-zinc-700 bg-zinc-900" />
                <button type="button" onClick={() => handleChange("ticket_photo_url", "")} className="absolute top-2 right-2 p-1 bg-zinc-900/90 rounded-full border border-zinc-700">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-zinc-700 cursor-pointer hover:border-yellow-500/50 transition-colors">
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleTicketUpload} disabled={uploading} />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <Upload className="w-4 h-4 text-zinc-500" />}
                <span className="text-sm text-zinc-500">{uploading ? "Subiendo..." : "Subir foto o PDF del ticket"}</span>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={e => handleChange("notes", e.target.value)} className="bg-zinc-900 border-zinc-700 min-h-16" placeholder="Observaciones..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {fuelUp ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
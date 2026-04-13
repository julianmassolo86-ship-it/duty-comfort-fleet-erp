import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const EVENT_TYPES = [
  { value: "pinchazo", label: "🔴 Pinchazo" },
  { value: "reparacion", label: "🔧 Reparación" },
  { value: "recapado", label: "♻️ Recapado" },
  { value: "rotacion", label: "🔄 Rotación" },
  { value: "baja", label: "⛔ Baja" },
  { value: "robo", label: "🚨 Robo" },
  { value: "compra", label: "🛒 Compra" },
];

export default function TireEventDialog({ open, onOpenChange, tires, vehicles, prefillTireId, onSave, companyId }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      event_date: new Date().toISOString().split("T")[0],
      company_id: companyId,
      tire_id: prefillTireId || "",
    });
  }, [open, companyId, prefillTireId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", isDark ? "bg-zinc-900 border-zinc-800 text-white" : "")}>
        <DialogHeader>
          <DialogTitle>Registrar Evento de Neumático</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Neumático *</Label>
            <Select value={form.tire_id || ""} onValueChange={v => set("tire_id", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar neumático" />
              </SelectTrigger>
              <SelectContent>
                {tires.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.brand} {t.size} — {t.serial_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo de Evento *</Label>
            <Select value={form.event_type || ""} onValueChange={v => set("event_type", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha *</Label>
              <Input type="date" value={form.event_date || ""} onChange={e => set("event_date", e.target.value)}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
            <div className="space-y-1">
              <Label>Costo</Label>
              <Input type="number" value={form.cost || ""} onChange={e => set("cost", parseFloat(e.target.value))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Vehículo (opcional)</Label>
            <Select value={form.vehicle_id || ""} onValueChange={v => set("vehicle_id", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— Sin vehículo —</SelectItem>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.plate || v.internal_number} — {v.manufacturer} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Km del vehículo</Label>
            <Input type="number" value={form.vehicle_km || ""} onChange={e => set("vehicle_km", parseFloat(e.target.value))}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
              className={isDark ? "bg-zinc-800 border-zinc-700" : ""} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? "Guardando..." : "Registrar Evento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
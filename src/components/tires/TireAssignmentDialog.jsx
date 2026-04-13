import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const POSITIONS = [
  { value: "eje_1_izq", label: "Eje 1 - Izquierdo" },
  { value: "eje_1_der", label: "Eje 1 - Derecho" },
  { value: "eje_2_izq_ext", label: "Eje 2 - Izq. Externo" },
  { value: "eje_2_izq_int", label: "Eje 2 - Izq. Interno" },
  { value: "eje_2_der_ext", label: "Eje 2 - Der. Externo" },
  { value: "eje_2_der_int", label: "Eje 2 - Der. Interno" },
  { value: "eje_3_izq_ext", label: "Eje 3 - Izq. Externo" },
  { value: "eje_3_izq_int", label: "Eje 3 - Izq. Interno" },
  { value: "eje_3_der_ext", label: "Eje 3 - Der. Externo" },
  { value: "eje_3_der_int", label: "Eje 3 - Der. Interno" },
  { value: "repuesto_1", label: "Repuesto 1" },
  { value: "repuesto_2", label: "Repuesto 2" },
];

export default function TireAssignmentDialog({ open, onOpenChange, vehicles, tires, onSave, companyId, prefillVehicleId }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({ mount_date: new Date().toISOString().split("T")[0], is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      mount_date: new Date().toISOString().split("T")[0],
      is_active: true,
      company_id: companyId,
      vehicle_id: prefillVehicleId || ""
    });
  }, [open, companyId, prefillVehicleId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const stockTires = tires.filter(t => t.status === "en_stock");

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
          <DialogTitle>Montar Neumático en Vehículo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Vehículo *</Label>
            <Select value={form.vehicle_id || ""} onValueChange={v => set("vehicle_id", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.plate || v.internal_number} — {v.manufacturer} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Neumático en Stock *</Label>
            <Select value={form.tire_id || ""} onValueChange={v => set("tire_id", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar neumático" />
              </SelectTrigger>
              <SelectContent>
                {stockTires.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.brand} {t.model} — {t.size} ({t.serial_number})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Posición *</Label>
            <Select value={form.position || ""} onValueChange={v => set("position", v)}>
              <SelectTrigger className={isDark ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectValue placeholder="Seleccionar posición" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha Montaje *</Label>
              <Input type="date" value={form.mount_date || ""} onChange={e => set("mount_date", e.target.value)}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
            <div className="space-y-1">
              <Label>Km al montar</Label>
              <Input type="number" value={form.km_mount || ""} onChange={e => set("km_mount", parseFloat(e.target.value))}
                className={isDark ? "bg-zinc-800 border-zinc-700" : ""} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {saving ? "Guardando..." : "Montar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}